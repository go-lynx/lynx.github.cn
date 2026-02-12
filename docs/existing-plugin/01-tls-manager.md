---
id: tls-manager
title: Certificate Management
slug: existing-plugin/tls-manager
---

# Certificate Management

Go-Lynx provides a certificate loading plugin for encrypted communication between microservices within the internal network. This plugin can automatically load specified certificates and include the root certificate in the default trust. The security level can be adjusted as needed. Go-Lynx considers the security of internal scheduling communication to be an indispensable configuration, so we have specifically organized and explained the certificate configuration plugin.

## Certificate Loading

To specify certificate loading, you need to configure it in the configuration file, with the content as follows:

```yaml
lynx:
  application:
    name: svc-name
    version: v1.0.0
    tls:
      file_name: tls-service.yaml
      group: svc-group
```

The `lynx.application.tls` section in the configuration file is where the certificate is stored. Currently, it defaults to loading from the configuration center, and support for local and remote loading will be updated later.

After the certificate is loaded, the application will have the certificate information. In the corresponding GRPC and HTTP clients, you only need to enable the configuration to provide the corresponding TLS communication. The configuration is as follows:

```yaml
lynx:
  application:
    name: svc-name
    version: v1.0.0
    tls:
      file_name: tls-service.yaml
      group: svc-group
  http:
    addr: 0.0.0.0:8000
    timeout: 5s
    tls: true
  grpc:
    addr: 0.0.0.0:9000
    timeout: 5s
    tls: true
```

When the `lynx.http.tls` configuration is set to `true`, the HTTP plugin will automatically load the corresponding certificate information when loaded, thus providing HTTPS functionality.

## Self-signed Certificates

You can refer to the author's blog post, which details how to create self-signed certificates using OpenSSL and configure the corresponding certificate information.

Article link:
[TLS Self-signed Certificate](https://tanzhuo.xyz/grpcs-t-l-s/)

You can also continue reading the following certificate generation tutorial, where I have copied most of the content into this document.

### Certificate Generation

Here are the steps to generate a self-signed certificate using the OpenSSL command-line tool on Linux or MacOS systems. This process will create a new root certificate (CA) and then sign a new server certificate with this root certificate.

#### Overall Process

> 1 Root Certificate:
> 1.1 Generate root private key
> 1.2 Generate root certificate using the root private key

> 2 Service Certificate
> 2.1 Generate service private key
> 2.2 Generate service CSR using the service private key
> 2.3 Sign the service certificate.crt file using the service.csr file + root certificate + root certificate key

#### Generate Root Certificate Private Key
```bash
openssl genrsa -out ca.key 2048
```
This command generates a new RSA private key, 2048 bits in length, which will be saved to a file named ca.key.

#### Generate Root Certificate
```bash
openssl req -new -x509 -days 365 -key ca.key -out ca.crt
```
This command generates a new X.509 root certificate, signed with SHA-256, valid for 365 days (you can adjust the date). This certificate will be saved to a file named ca.crt.

When executing this command, OpenSSL will prompt you for some information, which will be included in the certificate. In most cases, you can simply press Enter to accept the default values.

However, the Subject Name or Common Name should be filled in with the name of the microservice endpoint.

#### Generate Service Certificate Private Key
```bash
openssl genrsa -out [service-name].key 2048
```
This command is similar to the first one, generating a private key that will be saved to a file named [service-name].key. [service-name] should be replaced with your own service name.

#### Generate Service Certificate Signing Request (CSR)
```bash
openssl req -new -key [service-name].key -out [service-name].csr
```
This command generates a new certificate signing request (CSR) containing the server certificate's public key and some additional information. This request will be saved to a file named server.csr.

Again, OpenSSL will prompt you for some information, which will be included in the CSR.

#### Sign Service Certificate with Root Certificate
```bash
openssl x509 -req -in [service-name].csr -CA ca.crt -CAkey ca.key -CAcreateserial -out [service-name].crt -days 365
```
This command signs the server certificate with the root certificate, and the resulting certificate will be saved to a file named server.crt.

The generated rootCA.crt, server.crt, and server.key can be used for GRPC encrypted communication, configured on the corresponding server and client.

#### Customize Certificate Field Information
Due to adjustments in Go's higher versions regarding the validation and retrieval of certain fields within the certificate (Go 1.15 and later versions will retrieve the alt_names field information for service name validation), we need to specify some custom field information when generating the certificate.

Create a san.cnf file with the following content:
```text
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn

[dn]
C = CN
ST = Beijing
L = Beijing
O = 'lynx'
OU = 'lynx'
emailAddress = 'lynx'
CN = [service-name]

[req_ext]
subjectAltName = @alt_names

[alt_names]
DNS.1 = [service-name]

[v3_ext]
authorityKeyIdentifier=keyid,issuer:always
basicConstraints=CA:FALSE
keyUsage=keyEncipherment,dataEncipherment,digitalSignature
extendedKeyUsage=serverAuth,clientAuth
subjectAltName=@alt_names
```

Then, when generating the certificate files, include the following commands:

When generating the service CSR file, add -extensions req_ext -config san.cnf:
```bash
openssl req -new -key [service-name].key -out [service-name].csr -extensions req_ext -config san.cnf
```

When generating the service certificate, also add -extensions v3_ext -extfile san.cnf:
```bash
openssl x509 -req -in [service-name].csr -CA ca.crt -CAkey ca.key -CAcreateserial -out [service-name].crt -days 365 -extensions v3_ext -extfile san.cnf
```
This will generate a certificate file that includes the specified field content and some certificate description information.

### Certificate Content Verification
You can use the following command to check if the generated certificate indeed contains the field information:

```bash
openssl x509 -in [service-name].crt -text -noout
```

## Configuration

Create a configuration file in the control plane's configuration center with the following content:

```yaml
crt: |
-----BEGIN CERTIFICATE-----
MIIDjzCCAnegAwIBAgIUeHirgWlXHIcTcsU5XjXphk6HYeAwDQYJKoZIhvcNAQEL
BQAwVzELMAkGA1UEBhMCQVUxEzARBgNVBAgMClNvbWUtU3RhdGUxITAfBgNVBAoM
GEludGVybmV0IFdpZGdpdHMgUHR5IEx0ZDEQMA4GA1UEAwwHcmMtdXNlcjAeFw0y
MzExMDgwNDExMTRaFw0yNDExMDcwNDExMTRaMFcxC...
-----END CERTIFICATE-----

key: |
-----BEGIN PRIVATE KEY-----
MIIDjzCCAnegAwIBAgIUeHirgWlXHIcTcsU5XjXphk6HYeAwDQYJKoZIhvcNAQEL
BQAwVzELMAkGA1UEBhMCQVUxEzARBgNVBAgMClNvbWUtU3RhdGUxITAfBgNVBAoM
GEludGVybmV0IFdpZGdpdHMgUHR5IEx0ZDEQMA4GA1UEAwwHcmMtdXNlcjAeFw0y
MzExMDgwNDExMTRaFw0yNDExMDcwNDExMTRaMFcxC...
-----END PRIVATE KEY-----

rootCA: |
-----BEGIN CERTIFICATE-----
MIIDjzCCAnegAwIBAgIUeHirgWlXHIcTcsU5XjXphk6HYeAwDQYJKoZIhvcNAQEL
BQAwVzELMAkGA1UEBhMCQVUxEzARBgNVBAgMClNvbWUtU3RhdGUxITAfBgNVBAoM
GEludGVybmV0IFdpZGdpdHMgUHR5IEx0ZDEQMA4GA1UEAwwHcmMtdXNlcjAeFw0y
MzExMDgwNDExMTRaFw0yNDExMDcwNDExMTRaMFcxC...
-----END CERTIFICATE-----
```

In the project, after introducing the certificate plugin, the service will automatically retrieve the certificate configuration information upon startup. The location from which to retrieve the configuration is based on the file path you have specified in the configuration center.