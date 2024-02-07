---
id: seata
title: 分布式事务插件
---

# seata

seata 是一款开源的分布式事务解决方案，致力于提供高性能和简单易用的分布式事务服务。Go-Lynx 集成了seata，以提供分布式事务能力。

## 使用方法

在配置文件中先启用seata配置，文件内容如下：

```yaml
lynx:
  seata:
    enabled: true
    config_path: /path/to/seatago.yml
```
其中 `config_path` 配置项为seata配置文件的路径。seata插件将会自动去启动seata对应的客户端初始化程序。

如何部署seata？

查看seata官方文档进行TM服务部署: [seata官网文档](https://seata.apache.org/)

`seatago.yml` 文件内容如下：

```yaml
seata:
  enabled: true
  # application id
  application-id: applicationName
  # service group
  tx-service-group: default_tx_group
  access-key: aliyunAccessKey
  secret-key: aliyunSecretKey
  enable-auto-data-source-proxy: true
  data-source-proxy-mode: AT
  client:
    rm:
      # Maximum cache length of asynchronous queue
      async-commit-buffer-limit: 10000
      # The maximum number of retries when report reports the status
      report-retry-count: 5
      # The interval for regularly checking the metadata of the db（AT）
      table-meta-check-enable: false
      # Whether to report the status if the transaction is successfully executed（AT）
      report-success-enable: false
      # Whether to allow regular check of db metadata（AT）
      saga-branch-register-enable: false
      saga-json-parser: fastjson
      saga-retry-persist-mode-update: false
      saga-compensate-persist-mode-update: false
      #Ordered.HIGHEST_PRECEDENCE + 1000  #
      tcc-action-interceptor-order: -2147482648
      # Parse SQL parser selection
      sql-parser-type: druid
      lock:
        retry-interval: 30
        retry-times: 10
        retry-policy-branch-rollback-on-conflict: true
    tm:
      commit-retry-count: 5
      rollback-retry-count: 5
      default-global-transaction-timeout: 60s
      degrade-check: false
      degrade-check-period: 2000
      degrade-check-allow-times: 10s
      interceptor-order: -2147482648
    undo:
      # Judge whether the before image and after image are the same，If it is the same, undo will not be recorded
      data-validation: true
      # Serialization method
      log-serialization: jackson
      # undo log table name
      log-table: undo_log
      # Only store modified fields
      only-care-update-columns: true
      compress:
        # Whether compression is required
        enable: true
        # Compression type
        type: zip
        #  Compression threshold Unit: k
        threshold: 64k
    load-balance:
      type: RandomLoadBalance
      virtual-nodes: 10
  service:
    vgroup-mapping:
      # Prefix for Print Log
      default_tx_group: default
    grouplist:
      default: 127.0.0.1:8091
    enable-degrade: false
    # close the transaction
    disable-global-transaction: false
  transport:
    shutdown:
      wait: 3s
    # Netty related configurations
    # type
    type: TCP
    server: NIO
    heartbeat: true
    # Encoding and decoding mode
    serialization: seata
    # Message compression mode
    compressor: none
    # Allow batch sending of requests (TM)
    enable-tm-client-batch-send-request: false
    # Allow batch sending of requests (RM)
    enable-rm-client-batch-send-request: true
    # RM send request timeout
    rpc-rm-request-timeout: 30s
    # TM send request timeout
    rpc-tm-request-timeout: 30s
  # Configuration Center
  config:
    type: file
    file:
      name: config.conf
    nacos:
      namespace: ""
      server-addr: 127.0.0.1:8848
      group: SEATA_GROUP
      username: ""
      password: ""
      ##if use MSE Nacos with auth, mutex with username/password attribute
      #access-key: ""
      #secret-key: ""
      data-id: seata.properties
  # Registration Center
  registry:
    type: file
    file:
      name: registry.conf
    nacos:
      application: seata-server
      server-addr: 127.0.0.1:8848
      group: "SEATA_GROUP"
      namespace: ""
      username: ""
      password: ""
      ##if use MSE Nacos with auth, mutex with username/password attribute  #
      #access-key: ""  #
      #secret-key: ""  #
  log:
    exception-rate: 100
  tcc:
    fence:
      # Anti suspension table name
      log-table-name: tcc_fence_log_test
      clean-period: 60s
  # getty configuration
  getty:
    reconnect-interval: 0
    # temporary not supported connection-num
    connection-num: 1
    session:
      compress-encoding: false
      tcp-no-delay: true
      tcp-keep-alive: true
      keep-alive-period: 120s
      tcp-r-buf-size: 262144
      tcp-w-buf-size: 65536
      tcp-read-timeout: 1s
      tcp-write-timeout: 5s
      wait-timeout: 1s
      max-msg-len: 16498688
      session-name: client_test
      cron-period: 1s
```

如何使用 seata 的事务管理？

我们给您提供了官方案例进行参考：

```go

package main

import (
	"context"
	"database/sql"
	"time"

	"github.com/seata/seata-go/pkg/client"
	sql2 "github.com/seata/seata-go/pkg/datasource/sql"
	"github.com/seata/seata-go/pkg/tm"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

type OrderTblModel struct {
	Id            int64  `gorm:"column:id" json:"id"`
	UserId        string `gorm:"column:user_id" json:"user_id"`
	CommodityCode string `gorm:"commodity_code" json:"commodity_code"`
	Count         int64  `gorm:"count" json:"count"`
	Money         int64  `gorm:"money" json:"money"`
	Descs         string `gorm:"descs" json:"descs"`
}

func main() {
	// insert
	tm.WithGlobalTx(context.Background(), &tm.GtxConfig{
		Name:    "ATSampleLocalGlobalTx",
		Timeout: time.Second * 30,
	}, insertData)
	<-make(chan struct{})
}

// insertData insert one data
func insertData(ctx context.Context) error {
	data := OrderTblModel{
		Id:            1,
		UserId:        "NO-100003",
		CommodityCode: "C100001",
		Count:         101,
		Money:         11,
		Descs:         "insert desc",
	}
	return gormDB.WithContext(ctx).Table("order_tbl").Create(&data).Error
}
```

以上案例中我们去掉了数据库加载，seata初始化逻辑，只保留了如何使用全球事务的案例信息，这样更加清晰容易理解。
