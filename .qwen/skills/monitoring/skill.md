# Logging + Monitoring

**Описание:** Отладка NiFi конвейеров и мониторинг инфраструктуры.

**Для чего используется:**
- Отладка NiFi конвейеров
- Мониторинг производительности сервисов
- Сбор и анализ метрик
- Alerting при проблемах

**Основные принципы:**

1. **Prometheus конфигурация (prometheus.yml):**
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']

  - job_name: 'activepieces'
    static_configs:
      - targets: ['activepieces:8080']

  - job_name: 'nifi'
    static_configs:
      - targets: ['nifi:8080']
    metrics_path: /nifi-api/metrics
```

2. **Grafana Dashboards:**
```json
{
  "dashboard": {
    "title": "Pygmalion Infrastructure",
    "panels": [
      {
        "title": "CPU Usage",
        "targets": [
          {
            "expr": "rate(node_cpu_seconds_total{mode!=\"idle\"}[5m])",
            "legendFormat": "{{instance}}"
          }
        ]
      },
      {
        "title": "Memory Usage",
        "targets": [
          {
            "expr": "node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes"
          }
        ]
      },
      {
        "title": "PostgreSQL Connections",
        "targets": [
          {
            "expr": "pg_stat_activity_count"
          }
        ]
      },
      {
        "title": "Activepieces Workflows",
        "targets": [
          {
            "expr": "activepieces_workflows_executed_total"
          }
        ]
      }
    ]
  }
}
```

3. **NiFi Logging:**
```xml
<!-- logback.xml -->
<configuration>
  <appender name="FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
    <file>logs/nifi-app.log</file>
    <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
      <fileNamePattern>logs/nifi-app.%d{yyyy-MM-dd}.log</fileNamePattern>
      <maxHistory>30</maxHistory>
    </rollingPolicy>
    <encoder>
      <pattern>%d{ISO8601} %-5level [%t] %c{36} - %msg%n</pattern>
    </encoder>
  </appender>

  <logger name="org.apache.nifi" level="INFO"/>
  <logger name="org.apache.nifi.processors" level="DEBUG"/>
  <logger name="com.pygmalion" level="DEBUG"/>

  <root level="INFO">
    <appender-ref ref="FILE"/>
  </root>
</configuration>
```

4. **Alert Rules (alerts.yml):**
```yaml
groups:
  - name: pygmalion_alerts
    rules:
      - alert: HighCPUUsage
        expr: rate(node_cpu_seconds_total{mode!="idle"}[5m]) > 0.8
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage detected"
          description: "CPU usage is above 80% for more than 5 minutes"

      - alert: PostgreSQLDown
        expr: up{job="postgres"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "PostgreSQL is down"

      - alert: ActivepiecesWorkflowFailed
        expr: rate(activepieces_workflows_failed_total[5m]) > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High workflow failure rate"
```

5. **Docker Compose для мониторинга:**
```yaml
services:
  prometheus:
    image: prom/prometheus:v2.45.0
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana:10.0.0
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    depends_on:
      - prometheus

  node-exporter:
    image: prom/node-exporter:v1.6.0
    ports:
      - "9100:9100"

volumes:
  prometheus_data:
  grafana_data:
```

**Ссылки:**
- Prometheus Docs: https://prometheus.io/docs
- Grafana Docs: https://grafana.com/docs
- NiFi Toolkit: https://nifi.apache.org/docs/nifi-docs/html/administration-guide.html
