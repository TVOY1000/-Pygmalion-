#!/usr/bin/env python3
"""
Pygmalion Business Metrics Exporter for Prometheus
Canon v1.0 · 1000 O.K. × 20 000 транзакций/сутки

Экспорт бизнес-метрик из PostgreSQL в формате Prometheus
"""

import os
import time
import psycopg2
from prometheus_client import start_http_server, Gauge, Counter, CollectorRegistry, REGISTRY

# Конфигурация подключения к БД
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'pgbouncer'),
    'port': os.getenv('DB_PORT', '6432'),
    'database': os.getenv('DB_NAME', 'pygmalion'),
    'user': os.getenv('DB_USER', 'pygmalion'),
    'password': os.getenv('DB_PASSWORD', 'pygmalion_prod_secure_2026'),
}

# Создание метрик Prometheus
class PygmalionMetrics:
    def __init__(self):
        self.registry = CollectorRegistry()
        
        # O.K. метрики
        self.active_ok = Gauge(
            'pygmalion_active_ok_count',
            'Active Open Keys count',
            registry=self.registry
        )
        
        # Транзакции
        self.transactions_24h = Gauge(
            'pygmalion_transactions_24h',
            'Total transactions in last 24 hours',
            registry=self.registry
        )
        
        self.transactions_per_second = Gauge(
            'pygmalion_transactions_per_second',
            'Transactions per second (avg 5 min)',
            registry=self.registry
        )
        
        # Сгорание У.Е.
        self.ue_burned_24h = Gauge(
            'pygmalion_ue_burned_24h',
            'Burned UE in last 24 hours',
            registry=self.registry
        )
        
        # ro.DAG валидации
        self.rodag_success = Counter(
            'pygmalion_rodag_validation_success_total',
            'Successful ro.DAG validations in last hour',
            registry=self.registry
        )
        
        self.rodag_failures = Counter(
            'pygmalion_rodag_validation_failures_total',
            'Failed ro.DAG validations in last hour',
            registry=self.registry
        )
        
        # Время ответа БД
        self.db_response_p95 = Gauge(
            'pygmalion_db_response_time_p95_ms',
            'Database response time p95 (ms)',
            registry=self.registry
        )
        
        self.db_response_p99 = Gauge(
            'pygmalion_db_response_time_p99_ms',
            'Database response time p99 (ms)',
            registry=self.registry
        )
        
        # Подключения к БД
        self.db_connections = Gauge(
            'pygmalion_db_connections_active',
            'Active database connections',
            registry=self.registry
        )
        
        # Коны
        self.active_kons = Gauge(
            'pygmalion_active_kons_count',
            'Active kons (life cycles) count',
            registry=self.registry
        )
        
        self.expiring_kons = Gauge(
            'pygmalion_expiring_kons_count',
            'Kons expiring in less than 4 hours',
            registry=self.registry
        )
        
        # Репутация
        self.avg_reputation = Gauge(
            'pygmalion_avg_reputation_weight',
            'Average reputation weight of active participants',
            registry=self.registry
        )
        
        # Статистика по доменам
        self.domain_transactions = Gauge(
            'pygmalion_domain_transactions',
            'Transactions by domain',
            ['domain'],
            registry=self.registry
        )
        
        # Статистика по типам транзакций
        self.transaction_by_type = Gauge(
            'pygmalion_transaction_by_type',
            'Transactions by type',
            ['type'],
            registry=self.registry
        )

    def collect_metrics(self, conn):
        """Сбор метрик из БД"""
        with conn.cursor() as cur:
            # Активные O.K.
            cur.execute("SELECT prometheus_active_ok_count()")
            self.active_ok.set(cur.fetchone()[0])
            
            # Транзакции за 24 часа
            cur.execute("SELECT prometheus_transactions_24h()")
            self.transactions_24h.set(cur.fetchone()[0])
            
            # Транзакции в секунду
            cur.execute("SELECT prometheus_transactions_per_second()")
            self.transactions_per_second.set(cur.fetchone()[0])
            
            # Сгоревшие У.Е.
            cur.execute("SELECT prometheus_ue_burned_24h()")
            self.ue_burned_24h.set(cur.fetchone()[0])
            
            # ro.DAG валидации
            cur.execute("SELECT prometheus_rodag_validation_success()")
            self.rodag_success._value._value = cur.fetchone()[0]
            
            cur.execute("SELECT prometheus_rodag_validation_failures()")
            self.rodag_failures._value._value = cur.fetchone()[0]
            
            # Время ответа БД
            cur.execute("SELECT prometheus_db_response_time_p95_ms FROM prometheus_metrics_db_p95")
            result = cur.fetchone()
            if result:
                self.db_response_p95.set(result[0])
            
            cur.execute("SELECT prometheus_db_response_time_p99_ms FROM prometheus_metrics_db_p99")
            result = cur.fetchone()
            if result:
                self.db_response_p99.set(result[0])
            
            # Подключения к БД
            cur.execute("SELECT prometheus_db_connections_active FROM prometheus_metrics_connections")
            result = cur.fetchone()
            if result:
                self.db_connections.set(result[0])
            
            # Активные коны
            cur.execute("SELECT prometheus_active_kons_count()")
            self.active_kons.set(cur.fetchone()[0])
            
            #即将 сгорающие коны
            cur.execute("SELECT prometheus_expiring_kons_count()")
            self.expiring_kons.set(cur.fetchone()[0])
            
            # Средняя репутация
            cur.execute("SELECT prometheus_avg_reputation_weight()")
            self.avg_reputation.set(cur.fetchone()[0])
            
            # Статистика по доменам
            cur.execute("""
                SELECT domain, COUNT(*) 
                FROM transactions 
                WHERE domain IS NOT NULL 
                GROUP BY domain
            """)
            for row in cur.fetchall():
                self.domain_transactions.labels(domain=row[0]).set(row[1])
            
            # Статистика по типам транзакций
            cur.execute("""
                SELECT transaction_type, COUNT(*) 
                FROM transactions 
                GROUP BY transaction_type
            """)
            for row in cur.fetchall():
                self.transaction_by_type.labels(type=row[0]).set(row[1])

    def update(self):
        """Обновление метрик"""
        try:
            conn = psycopg2.connect(**DB_CONFIG)
            self.collect_metrics(conn)
            conn.close()
        except Exception as e:
            print(f"Error collecting metrics: {e}")


def main():
    """Запуск экспортера метрик"""
    port = int(os.getenv('EXPORTER_PORT', '9187'))
    
    # Запуск HTTP сервера для Prometheus
    start_http_server(port)
    print(f"Pygmalion Metrics Exporter started on port {port}")
    
    metrics = PygmalionMetrics()
    
    # Обновление метрик каждые 15 секунд
    while True:
        metrics.update()
        time.sleep(15)


if __name__ == '__main__':
    main()
