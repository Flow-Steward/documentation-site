---
sidebar_position: 2
title: Answer the Installer Questions
description: A practical VPS and local installation walkthrough, including existing Apache, Nginx, and Traefik.
---

# Answer the Installer Questions

Use this guide when running `./install.sh` from a Flow Steward checkout on your
computer or VPS. It explains the actual question labels, what to enter, and
where to find the values. Start with [Installation](installation) for obtaining
the checkout; use [Installer Reference](../reference/installer) for automation
flags. This guide describes application revision
`1a66a0490e` (version 0.7.27), reviewed against the installer source on
2026-10-26.

## Before starting

**Docker is required for both Compact and Scalable.** Install Docker Engine and
the Compose v2 plugin on a Linux VPS, or Docker Desktop with Linux containers on
a desktop. Flow Steward does not install Docker for you. Follow the official
[Docker Engine installation guide](https://docs.docker.com/engine/install/)
and [Compose plugin instructions](https://docs.docker.com/compose/install/linux/),
or [Docker Desktop installation guide](https://docs.docker.com/desktop/).

Use a non-root deployment account with Docker access; `./install.sh` refuses
root and should not be launched with `sudo`. Run these checks as that account:

```bash
docker --version
docker compose version
docker info
git --version
git rev-parse HEAD
uname -m
df -h .
```

The Docker daemon must be running and accessible to that account. The installer
uses the local Docker socket; a remote Docker context over SSH/TCP is not
supported. Run it on the VPS itself. The source must be a real Git checkout
(the installer records the checked-out commit), not a copied folder without
`.git`. Git LFS is not needed. The preflight accepts only **amd64** (`x86_64`)
and **arm64** (`aarch64`) hosts and stops with `unsupported_architecture` on
anything else; `uname -m` shows yours. It also requires at least 4 GiB free;
that is a refusal threshold, not a production capacity recommendation.
Images, builds, artifacts, logs, database growth, and backups need additional
space. A Bash/POSIX environment and common system utilities are required;
on Windows use Git Bash or WSL rather than PowerShell to launch the script.

For a public deployment, prepare:

- A hostname such as `flow.example.com`, with DNS pointing to the VPS or its
  actual ingress. Use the DNS provider's record list and `getent ahosts
  flow.example.com` on Linux to check resolution. Check both A and AAAA records.
- A decision about who already owns ports 80 and 443. On Linux,
  `sudo ss -ltnp` lists listeners; `docker ps --format 'table {{.Names}}\t{{.Ports}}'`
  shows published Docker ports. Do not stop an existing website to free a port.
- A certificate plan and, if there is an existing proxy, its owner/configuration
  and network details. The installer does not configure DNS, firewall rules,
  external proxy certificates, or external proxy services.
- Persistent disk and an off-host backup plan. Local storage on the VPS survives
  container replacement but does not protect against loss of the VPS.

## Choose the route that matches this machine

| Your situation | Ingress owner | Network and TLS | Other key answers |
|---|---|---|---|
| First trial on your own computer | **Bundled Traefik** | **Local/private generated certificate** | `localhost`, public port `8099`, redirect port `8080` if free |
| Public VPS with no existing web proxy | **Bundled Traefik** | **Bundled ACME certificate** | Real domain, public port `443`, redirect port `80`, contact and CA directory |
| Apache or Nginx runs directly on the VPS | **Existing reverse proxy** | **Existing reverse-proxy TLS** | **Host**, correct **Proxy kind**, loopback backend `127.0.0.1:18099` |
| Apache or Nginx runs in Docker | **Existing reverse proxy** | **Existing reverse-proxy TLS** | **Docker network**, existing shared network; see the readiness limitation below |
| Existing Traefik runs in Docker | **Existing Traefik** | **Existing Traefik resolver** or **Existing Traefik certificate** | Existing Docker network and exact entrypoint/resolver names |
| A hosting provider owns routing/TLS | **Hosting platform ingress** | **Hosting platform TLS** | Compact only; follow the provider-specific [Installation](installation) procedure |

An Apache/Nginx service on the host does **not** make Flow Steward a host-native
application. Flow Steward still runs in Docker. **Proxy placement** describes
only your existing proxy.

For a local trial use **Production** + **Compact single-runtime deployment**.
Production means the minimal runtime preset; it does not require a public domain.
**Development** is the contributor preset and must be paired with **Scalable
multi-container runtime**. Compact requires Production.

### Compact or Scalable

| Pick | When |
|---|---|
| **Compact** (default) | One server, one team, and you want the fewest moving parts. The whole application (web, API, MCP, workers, control plane) runs in one runtime container next to PostgreSQL and RabbitMQ. You scale it by raising **Compact worker processes**. This is the right answer for most installations and for every first trial. |
| **Scalable** | You need each role in its own container: separate worker containers you can add (`./flow-steward config set --worker-replicas N`), a separate MCP backend, and the full `./flow-steward stack` and `config` command set for changing an installed system. Pick it when you expect to grow the worker pool or change ingress/TLS/storage after installation without reinstalling. |

You can switch later with `./install.sh --deployment-profile scalable` (or
`compact`) on an installed system; take a complete backup first.

### All questions at a glance

The plain questionnaire asks these in this order. A question appears only when
its "Shown when" condition holds. Press Enter to keep the default.

| # | Question | Shown when | Default | What to pick |
|---|---|---|---|---|
| 1 | **Environment** | always | Production | Production. Development only for contributors, and only with Scalable. |
| 2 | **Deployment profile** | always | Compact | Compact unless the table above says Scalable. |
| 3 | **Compact runtime HTTP port** | Compact | `8080` | Keep `8080`; it is the runtime's internal listener, not a public port. |
| 4 | **Ingress owner** | always | Bundled Traefik | Bundled Traefik unless Apache, Nginx, Traefik or a hosting platform already owns ports 80/443. |
| 5 | **Compact worker processes** | Compact | `2` | Keep `2` to start; raise later with `./install.sh --worker-processes N`. |
| 6 | **File storage** | always | Bundled self-hosted storage | Compact: Enter; Compact records Local persistent filesystem unless `--file-storage` is passed on the command line (see [File storage](#2-file-storage)). Scalable: Local persistent filesystem for one machine, Bundled for an S3-style store on the same host, External S3 for a provider bucket. |
| 7–11 | **S3 endpoint**, **S3 bucket**, **S3 region**, **S3 credentials file**, **Allow insecure S3 HTTP** | External S3 | none, `flow-steward-artifacts`, `us-east-1`, none, No | Your provider's values; keep insecure HTTP at No. |
| 12 | **Network and TLS** | always | Local/private generated certificate | Must match the ingress owner; see [the TLS table](#3-public-address-and-tls). |
| 13 | **Public host (domain or IP)** | always | `localhost` | `localhost` for a trial on this computer; otherwise the real domain (or the server IP for a test). |
| 14 | **Public port** | always | `8099` | `443` for a public site; `8099` for a local trial. |
| 15 | **Plain-HTTP redirect port** | Bundled Traefik | `8080` | `80` with ACME; any free port otherwise. |
| 16–17 | **Reverse-proxy backend host**, **Reverse-proxy backend port** | Existing reverse-proxy TLS | `127.0.0.1`, `18099` | Keep both unless `18099` is taken. |
| 18 | **Reverse-proxy MCP port** | Existing reverse proxy | `18100` | Keep it (used by Scalable only). |
| 19 | **Proxy placement** | Existing reverse proxy | Host | Where your Apache/Nginx runs: on the host or in Docker. |
| 20 | **Proxy kind** | Existing reverse proxy | Nginx | Nginx or Apache, matching your proxy. |
| 21 | **Trusted proxy CIDRs** | always | `127.0.0.1/32,::1/128` | Keep the default with Bundled Traefik; see [trusted proxy addresses](#discover-trusted-proxy-addresses) for an existing proxy. |
| 22–24 | **Existing Traefik network**, **Traefik HTTPS entrypoint**, **Traefik HTTP entrypoint** | Existing Traefik | none, `websecure`, `web` | Names from your Traefik configuration. |
| 25 | **Traefik certificate resolver** | Existing Traefik resolver | none | The resolver name from your Traefik configuration. |
| 26 | **Existing proxy network** | Proxy placement is Docker network | none | The Docker network your proxy container is on. |
| 27–28 | **ACME contact**, **ACME directory URL** | Bundled ACME certificate | none, none | A monitored email; `https://acme-v02.api.letsencrypt.org/directory`. |
| 29 | **Extension installer origin** | always | `http://fs-extension-installer:8099` | Keep the default. |
| 30–31 | **Certificate path**, **Private key path** | always | `.ssl/cert.pem`, `.ssl/key.pem` | Keep the defaults unless you chose Operator-provided certificate. |

After the last question the installer prints **Review pending change:** with the
final values and asks **Apply this change?** (default No).

### What the installer does not ask

The questionnaire covers only how the platform runs and is reached. These are
set up later, in the browser or with `./flow-steward`:

- **Administrator account.** No email or password is asked. The installer
  prints a one-time setup link at the end; you create the first administrator
  there. See [Review, install, and create the first administrator](#review-install-and-create-the-first-administrator).
- **Outgoing email.** There is no SMTP question. After you sign in, install
  the Outgoing Email extension and create a connection with your SMTP server;
  password-reset and notification mail use it.
- **AI provider, API key and model.** Not needed to install. After you sign in,
  an administrator adds a provider account in the application.
- **Database and broker passwords and internal secrets.** Generated by the
  installer and kept in the installation's environment file; never typed.
- **Memory or CPU size.** There is no memory profile question. Capacity is the
  worker count: **Compact worker processes**, or worker containers on Scalable
  after installation.

## How the questions work

Run from the checkout directory:

```bash
./install.sh --plain
```

Plain mode is also the default for `./install.sh`. For a numbered choice, enter
the number printed beside the label, not the internal option name. Press Enter
to accept the displayed default. Boolean questions accept yes/no. Values passed
as command-line options are already supplied and are skipped in the plain
questionnaire.

The installer asks visible questions in the order below. A question marked
**advanced** is still asked in plain mode; in `./install.sh --tui`, expand
**Show advanced** to see it. Visibility follows previous answers, but the
**Network and TLS** list shows all eight choices: it does not filter out
incompatible choices. Choose the pair in the table above. The final
**Review pending change:** shows normalized values; **Apply this change?**
defaults to No. Confirm only when the host, ports, storage and routing match
your intended installation.

**Compact storage caveat.** With Compact, the installer records **Local
persistent filesystem** whatever you answer to **File storage**, in plain mode,
in `--tui` and in a non-interactive run, unless `--file-storage` was given on
the command line. The review screen shows the value that will be used. To get
bundled or external S3 storage on Compact, start the installer with the option,
for example `./install.sh --file-storage bundled`. Scalable keeps the answer you
give.

### 1. Environment and runtime

| Exact question | Default and visibility | What to enter |
|---|---|---|
| **Environment** | Production; always | Production for ordinary use, including a local trial. Development only for contributing/testing with Scalable. |
| **Deployment profile** | Compact single-runtime deployment; always | Compact for the initial single-runtime setup. Scalable separates app services into containers and is appropriate when you deliberately need that topology. |
| **Compact runtime HTTP port** | `8080`; Compact only, advanced | Usually keep `8080`. This is the runtime's internal HTTP listener, not your public HTTPS port. A Docker proxy must target this value. With **Hosting platform ingress** this port is published on the host for the platform's router. |
| **Ingress owner** | Bundled Traefik; always | Choose the owner from the route table above. **Hosting platform ingress** is only for a Compact host that sits behind a provider's own HTTPS load balancer: it publishes the runtime's plain HTTP port on the host and starts no proxy. Do not choose it on an ordinary VPS. |
| **Compact worker processes** | `2`; Compact only | Usually keep `2` initially. This is the number of queue workers inside the one runtime, not the number of runtime replicas. Raise it when jobs wait in the queue and the server has spare CPU and memory; change it later with `./install.sh --worker-processes N`. |

Compact still needs PostgreSQL and RabbitMQ containers. Selecting bundled
storage adds SeaweedFS. “Single runtime” does not mean the complete deployment
is one container. Do not run multiple Compact replicas against the same database
and broker as a way to scale it.

### 2. File storage

**File storage** offers:

1. **Local persistent filesystem** (`local_fs`): a simple choice for one machine.
   Compact stores artifacts under `/data/artifacts` in its persistent data
   volume; Scalable uses its persistent artifacts directory. Include this data
   in backups.
2. **Bundled self-hosted storage** (`bundled`, the prompt default): the
   installer starts and configures SeaweedFS. You do not supply S3 credentials
   for this option. Its persistent data and generated credentials need backup.
3. **External S3-compatible storage** (`external_s3`): bring an endpoint, bucket,
   region, and credentials from your storage administrator/provider.

Recommendation: **Local persistent filesystem** for a single server (this is
what Compact uses unless you pass `--file-storage`, see the caveat above).
Choose **External S3-compatible storage** when files must live off the server,
for example on a provider bucket with its own backups. **Bundled** adds a
SeaweedFS container on the same host; it gives an S3 interface but not
off-host safety.

The following five questions appear only for **External S3-compatible storage**:

| Exact question | Default | What to enter / where to find it |
|---|---|---|
| **S3 endpoint** | None; required | Provider's HTTPS S3 API endpoint, such as `https://s3.example.com`; not a bucket's browser console or download URL. |
| **S3 bucket** | `flow-steward-artifacts` | The actual artifact bucket name from the provider's bucket list. Arrange its existence/access with the storage owner before installing. |
| **S3 region** | `us-east-1` | Region expected by that endpoint; use the provider's documented value even for a non-AWS service. |
| **S3 credentials file** | None; required | Path to a regular private JSON file described below. Enter a path, never the key itself. |
| **Allow insecure S3 HTTP** | No | Keep No on a VPS. HTTP is allowed only with Development and an explicit Yes; Production rejects HTTP. |

For the **installer**, the JSON keys are exactly:

```json
{
  "access_key": "REPLACE_WITH_YOUR_ACCESS_KEY",
  "secret_key": "REPLACE_WITH_YOUR_SECRET_KEY"
}
```

Create the file privately, do not commit it, and restrict its permissions to
`0600` or stricter. It must not be a symbolic link. The installer reads it,
keeps credentials out of the configuration review, and later probes storage
with a write/read/delete cycle; read-only bucket access is insufficient.
The later storage-transition interface has a different credential-file format;
use the format documented for the command you are running.

A file selected during the questionnaire must be inside the checkout, for
example `.private/s3.json`. If the file lives elsewhere, supply its absolute
path **when launching**, so the launcher can mount it read-only:

```bash
./install.sh --plain --file-storage external_s3 \
  --s3-credentials-path /home/deploy/private/flow-steward-s3.json
```

Replace the example path with your existing file. Do not paste literal `~` or
use `../` to escape the checkout. The remaining S3 questions are still asked.

### 3. Public address and TLS

**Network and TLS** offers these exact choices:

| Choice | Compatible owner | Use it when |
|---|---|---|
| **Local/private generated certificate** (`local`, default) | Bundled Traefik | Local/private trial; generated certificate is not publicly trusted. |
| **Hostname generated certificate** (`self_signed`) | Bundled Traefik | You need a generated certificate for the supplied hostname/IP and control how clients trust it. |
| **Operator-provided certificate** (`provided`) | Bundled Traefik | You supply a matching PEM certificate chain and private key. You own renewal. |
| **Bundled ACME certificate** (`acme`) | Bundled Traefik | Bundled Traefik obtains/renews the public certificate using HTTP-01. |
| **Existing reverse-proxy TLS** (`reverse_proxy`) | Existing reverse proxy | Your Apache/Nginx terminates HTTPS and forwards private HTTP to Flow Steward. |
| **Existing Traefik resolver** (`external_resolver`) | Existing Traefik | Your Traefik already has a named certificate resolver. |
| **Existing Traefik certificate** (`external_certificate`) | Existing Traefik | Your Traefik already has the matching certificate loaded. No resolver is selected. |
| **Hosting platform TLS** (`platform_managed`) | Hosting platform ingress | The hosting platform terminates HTTPS for Compact. |

Recommendation: on your own computer keep **Local/private generated
certificate**. On a public VPS with a domain and nothing else on ports 80/443,
pick **Bundled ACME certificate**. If you already have a certificate from your
CA, pick **Operator-provided certificate**. If Apache, Nginx or Traefik already
serves the domain, pick the matching "Existing" choice so the certificate stays
where it is. **Hostname generated certificate** is for a temporary test by IP.

**Public host (domain or IP)** defaults to `localhost`. Enter only the hostname
or IP: `flow.example.com`, not `https://flow.example.com/`, a path, or a hostname
with a port. A public VPS normally needs its real domain. `localhost` refers to
the computer running the browser; it does not identify a remote VPS. The selected
host feeds the product URL and generated certificate names.

**Public port** defaults to `8099`. Enter the externally visible HTTPS port,
usually `443` for production. It is not the backend's HTTP port. For port 443,
the product URL is `https://flow.example.com`; for 8099 it includes `:8099`.

**Plain-HTTP redirect port** defaults to `8080`, is advanced, and appears only
for **Bundled Traefik**. Use a free port for local work; use `80` for the ordinary
public ACME setup. This port and the public HTTPS port are separate host
listeners. Changing **Compact runtime HTTP port** does not free a conflicting
redirect port.

### 4A. Bundled Traefik on a public VPS

Use **Bundled Traefik**, **Bundled ACME certificate**, your domain, public port
`443`, and **Plain-HTTP redirect port** `80`. DNS and inbound TCP 80/443 must
reach this machine and these listeners must be free. If another proxy owns
those ports, choose its existing-proxy branch instead.

Two questions appear for ACME:

- **ACME contact** has no default. Enter a monitored email address owned by your
  deployment operator.
- **ACME directory URL** has no default and is advanced, but is required for
  ACME. For Let's Encrypt production use
  `https://acme-v02.api.letsencrypt.org/directory`. Its testing directory is
  `https://acme-staging-v02.api.letsencrypt.org/directory`; staging certificates
  are not trusted by ordinary browsers and are unsuitable as a finished public
  setup. The installer has no staging-certificate trust bypass.

The bundled configuration uses HTTP-01, so a public CA must reach port 80; a
private `8080` listener without forwarding from public port 80 is insufficient.
See [Traefik's ACME requirements](https://doc.traefik.io/traefik/reference/install-configuration/tls/certificate-resolvers/acme/).

To supply your own certificate instead, choose **Operator-provided certificate**
and provide **Certificate path** / **Private key path** in the final advanced
questions. See [Certificate and internal settings](#5-certificate-and-internal-settings).

### 4B. Apache or Nginx already runs on the VPS host

Choose **Existing reverse proxy** and **Existing reverse-proxy TLS**. The
installer does not install a second public proxy. Answer:

| Exact question | Answer |
|---|---|
| **Reverse-proxy backend host** | Keep `127.0.0.1`; the validator requires this exact value. |
| **Reverse-proxy backend port** | Keep `18099` if free, or choose a different free local port. |
| **Reverse-proxy MCP port** | Keep `18100` if free for Scalable. Asked for either profile, advanced; Compact routes MCP through its one backend and does not need a separate MCP port. |
| **Proxy placement** | Host |
| **Proxy kind** | Nginx (default) or Apache, matching your existing service. |
| **Trusted proxy CIDRs** | See [Discover trusted proxy addresses](#discover-trusted-proxy-addresses). |

Find the existing site's configuration through your server management records.
Useful read-only checks on a Linux host are:

```bash
sudo ss -ltnp
sudo nginx -t
sudo apachectl -t -D DUMP_VHOSTS
sudo apachectl -M
```

Run only the checks for software you use. On Debian/Ubuntu the Apache command
may be `apache2ctl`; on other distributions it may be `httpd`. The virtual-host
listing identifies the relevant config file. Nginx commonly includes sites
from `/etc/nginx/sites-enabled/` or `/etc/nginx/conf.d/`; Apache commonly uses
`/etc/apache2/sites-enabled/` or `/etc/httpd/conf.d/`. These locations vary.
Read the existing site configuration locally; do not paste private keys or a
complete configuration dump into a support ticket.

The installer publishes private HTTP on loopback. Your existing HTTPS virtual
host must send requests to these destinations:

| Placement/profile | App, API and `/ws/` backend | `/mcp`, `/mcp/…` and `/.well-known/oauth-protected-resource…` backend |
|---|---|---|
| Host + Compact | `127.0.0.1:18099` | Same backend |
| Host + Scalable | `127.0.0.1:18099` | `127.0.0.1:18100` |
| Docker + Compact | `flow-steward-compact-proxy:8080` | Same backend |
| Docker + Scalable | `flow-steward-app-proxy:8099` | `flow-steward-mcp-proxy:8100` |

Replace host ports with your answers. Docker aliases use your installation's
Compose project prefix; `flow-steward` is the fallback prefix. Compact's Docker
port follows **Compact runtime HTTP port**. Docker destinations work only
inside the shared proxy network.

After installation configuration exists and its CLI is ready, obtain the exact
recorded fragment with this read-only command (available in both profiles):

```bash
./flow-steward proxy-fragment --json
```

The JSON result includes `app_backend`, `mcp_backend`, and `fragment`. With `jq`,
extract the text using:

```bash
./flow-steward proxy-fragment --json | jq -r '.result.fragment'
```

The generated fragment is an **HTTP port-80 routing example without certificate
material**. Do not replace your working HTTPS configuration with it unchanged.
Merge its route rules into your existing HTTPS site, retain your certificate
and renewal configuration, preserve forwarded host/protocol and authorization,
and test the proxy configuration before using your normal reload procedure.
The installer neither writes nor reloads that external proxy configuration.

#### Nginx example

For **Compact on the host**, this is a routing example to adapt inside your
existing TLS site. The paths shown for certificates are placeholders. The
upstream and upgrade headers follow the application's renderer; the TLS listener
and forwarded headers are operator additions for an HTTPS front end.

```nginx
server {
    listen 443 ssl;
    server_name flow.example.com;
    ssl_certificate /path/to/fullchain.pem;
    ssl_certificate_key /path/to/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:18099;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header Authorization $http_authorization;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_buffering off;
    }
}
```

Compact's one HTTP router serves all paths, including MCP and WebSockets. For
**Scalable**, retain `location /` for the app, and add the three more-specific
locations produced by `proxy-fragment`: `location = /mcp`, `location ^~ /mcp/`,
and `location ^~ /.well-known/oauth-protected-resource`. Each must use the MCP
backend (`http://127.0.0.1:18100` for the default Host answers), and each must
include the same proxy headers and `proxy_buffering off` shown above. Do not
add a trailing `/` to these `proxy_pass` backend URLs: the route must preserve
the original request path. Repeat the forwarded headers inside those locations;
Nginx header inheritance can change when a location defines its own headers.

Keep your HTTP-to-HTTPS redirect in the external proxy. Check with `sudo nginx
-t` before reloading. For a Docker proxy the equivalent check is `docker exec
YOUR_NGINX_CONTAINER nginx -t`. Nginx requires explicit upgrade forwarding for
WebSockets; see its [WebSocket documentation](https://nginx.org/en/docs/http/websocket.html)
and [proxy module reference](https://nginx.org/en/docs/http/ngx_http_proxy_module.html).

#### Apache example

The following is the renderer's routing arrangement adapted to an existing TLS
virtual host for **Scalable on the host**. Keep the specific paths before `/`.
For Compact, replace every `127.0.0.1:18100` below with `127.0.0.1:18099`.

```apache
<VirtualHost *:443>
    ServerName flow.example.com
    SSLEngine on
    SSLCertificateFile /path/to/fullchain.pem
    SSLCertificateKeyFile /path/to/privkey.pem
    ProxyRequests Off
    ProxyPreserveHost On
    RequestHeader set X-Forwarded-Proto "https"

    ProxyPass "/mcp" "http://127.0.0.1:18100/mcp" nocanon
    ProxyPassReverse "/mcp" "http://127.0.0.1:18100/mcp"
    ProxyPass "/.well-known/oauth-protected-resource" "http://127.0.0.1:18100/.well-known/oauth-protected-resource" nocanon
    ProxyPassReverse "/.well-known/oauth-protected-resource" "http://127.0.0.1:18100/.well-known/oauth-protected-resource"
    ProxyPass "/ws/" "ws://127.0.0.1:18099/ws/" nocanon
    ProxyPassReverse "/ws/" "ws://127.0.0.1:18099/ws/"
    ProxyPass "/" "http://127.0.0.1:18099/" nocanon
    ProxyPassReverse "/" "http://127.0.0.1:18099/"
</VirtualHost>
```

This requires `mod_proxy`, `mod_proxy_http`, `mod_proxy_wstunnel`, plus `mod_ssl`
and `mod_headers` for the shown TLS/header additions. Inspect `apachectl -M` to
see loaded modules. Enable missing modules through your distribution's normal
configuration procedure. Check `apachectl configtest` before your normal reload.
The explicit `ws://` route carries job-progress WebSockets. Do not put a blanket
HTTP `/` rule first: Apache matches proxy rules in configuration order. See the
[Apache proxy reference](https://httpd.apache.org/docs/2.4/mod/mod_proxy.html)
and [WebSocket tunnel module](https://httpd.apache.org/docs/2.4/mod/mod_proxy_wstunnel.html).

### 4C. Apache or Nginx already runs in Docker

Choose **Existing reverse proxy**, **Existing reverse-proxy TLS**, and
**Proxy placement → Docker network**. Choose the actual **Proxy kind**.
**Existing proxy network** then appears with no default: supply the exact
existing Docker network shared with the proxy. It is not a domain, a bridge
interface name, or a Compose service name.

Find the running proxy and its network without dumping environment variables:

```bash
docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Ports}}'
docker network ls
docker inspect YOUR_PROXY_CONTAINER --format '{{range $name, $net := .NetworkSettings.Networks}}{{printf "%s  IP=%s  gateway=%s\n" $name $net.IPAddress $net.Gateway}}{{end}}'
docker network inspect YOUR_NETWORK --format '{{range .IPAM.Config}}{{printf "subnet=%s gateway=%s\n" .Subnet .Gateway}}{{end}}'
docker network inspect YOUR_NETWORK --format '{{range .Containers}}{{printf "%s %s\n" .Name .IPv4Address}}{{end}}'
```

Replace the uppercase names with the names from the preceding output. Choose
a network containing the proxy that is intended for application ingress. The
installer joins that existing network; it does not create your proxy service.
Use the Docker backends in the preceding table, not `127.0.0.1:18099` inside the
proxy container: that address would refer to the proxy container itself. Host
backend questions still appear because visibility follows TLS mode, but this
overlay does not publish those host ports.

**Current source limitation:** the installer's `reverse_proxy` public-route
probe still targets the host backend port even for Docker placement, while this
overlay publishes no host port. A correctly connected Docker proxy can therefore
still fail installer readiness at `public_route`. This branch has not been
verified end to end for the reviewed revision. Do not publish a private backend
on all interfaces to work around the check. Preserve the failed installation
and its log for diagnosis; if you need a new installation without this unresolved
branch, choose a host proxy or existing Traefik design before starting.

### 4D. Existing Traefik

This branch expects an existing **Docker-connected Traefik** with its Docker
provider able to discover the installation's containers. Choose **Existing
Traefik** for **Ingress owner**. For **Network and TLS**, choose **Existing
Traefik resolver** if Traefik obtains the certificate, or **Existing Traefik
certificate** if a matching certificate is already loaded.

Answer these questions from the Traefik deployment's existing configuration:

| Exact question | Default | What it means |
|---|---|---|
| **Existing Traefik network** | None; required | Exact Docker network name shared with the running Traefik. Use the network discovery commands above. |
| **Traefik HTTPS entrypoint** | `websecure`; advanced | Name of the entrypoint receiving HTTPS; not `443` and not the hostname. |
| **Traefik HTTP entrypoint** | `web`; advanced | Existing HTTP entrypoint used for the redirect route. If your setup deliberately has no HTTP entrypoint, supply an empty value with `--traefik-http-entrypoint ''` instead of inventing one. |
| **Traefik certificate resolver** | None; only with Existing Traefik resolver | Exact resolver name defined under `certificatesResolvers`; not an email, certificate filename, or URL. |

The installer labels its routes and joins the selected network. It does not
create these entrypoints/resolvers, configure the existing Docker provider,
change provider constraints, or manage the existing Traefik's certificate store.
A network containing one container passes the basic attachment check; that
alone does not prove it is a correctly configured Traefik.

To find names, inspect the existing Traefik Compose file or its static
`traefik.yml` / `traefik.toml`. If you do not know where it is mounted, list only
mount paths:

```bash
docker inspect YOUR_TRAEFIK_CONTAINER --format '{{range .Mounts}}{{printf "%s -> %s\n" .Source .Destination}}{{end}}'
```

If configured by command-line flags, this read-only command prints only
entrypoint listener flags and resolver names:

```bash
docker inspect YOUR_TRAEFIK_CONTAINER --format '{{range .Args}}{{println .}}{{end}}' |
  sed -n -E '/^--[Ee]ntry[Pp]oints\.[^.]+\.address=/p; s/^--[Cc]ertificates[Rr]esolvers\.([^.]+)\..*/resolver: \1/p'
```

For example, these existing settings mean the HTTPS answer is `websecure`,
the HTTP answer is `web`, and the resolver answer is `letsencrypt`:

```yaml
entryPoints:
  web:
    address: ":80"
  websecure:
    address: ":443"
certificatesResolvers:
  letsencrypt:
    acme:
      # Existing contact, storage and challenge settings live here.
```

This is a names-only illustration, not a complete replacement configuration.
Do not read or share `acme.json`: it contains certificate account/private-key
material and is not where you obtain the resolver name. An existing dashboard
may also show router entrypoints and resolver assignments; do not enable a
public dashboard solely for discovery. See Traefik's
[entrypoint reference](https://doc.traefik.io/traefik/reference/install-configuration/entrypoints/)
and [resolver reference](https://doc.traefik.io/traefik/reference/install-configuration/tls/certificate-resolvers/acme/).

### Discover trusted proxy addresses

**Trusted proxy CIDRs** is always visible in plain mode and is advanced in the
full-screen form. Its default is `127.0.0.1/32,::1/128`. Enter a comma-separated
list of IP addresses/CIDRs for the **immediate proxy as seen by the Flow Steward
backend**. This lets the runtime trust forwarded request information from that
peer. It is not a list of users allowed to sign in.

For a Docker proxy/Traefik, inspect its IP on the shared network with the commands
above. A fixed proxy IP such as `172.23.0.5` can be represented as
`172.23.0.5/32`. If the IP changes on recreation, arrange stable addressing or
use a dedicated, controlled proxy subnet such as `172.23.0.0/24` only when all
members of that subnet are trusted to supply forwarded headers. Those are
examples; use your inspected values.

For a host proxy using Docker's loopback-published port, the backend may observe
a Docker bridge gateway rather than `127.0.0.1`. Inspect the relevant network's
`IPAM.Config` gateway and confirm the actual peer from your backend/proxy
network observations. Do not assume the loopback default covers traffic
translated through Docker. Keep unrelated clients/networks out of the list.
The validator rejects `0.0.0.0/0` and `::/0`.

There are two distinct trust settings if another load balancer sits in front
of Traefik:

- The Flow Steward question trusts **Traefik → Flow Steward**. Use Traefik's
  downstream address/network as observed by Flow Steward.
- Traefik's own `entryPoints.<name>.forwardedHeaders.trustedIPs` trusts
  **load balancer → Traefik**. Obtain those addresses from the load-balancer
  owner/provider and inspect the corresponding section in Traefik's static
  configuration. Flow Steward does not set this external Traefik option.

For example, an existing `entryPoints.websecure.forwardedHeaders.trustedIPs`
list is not automatically the correct answer to Flow Steward's question. If
Traefik directly receives browsers, it has no upstream proxy whose forwarded
headers should be trusted. Do not enable `forwardedHeaders.insecure` as a shortcut.
See [Traefik forwarded headers](https://doc.traefik.io/traefik/reference/install-configuration/entrypoints/#forwarded-headers).

### 5. Certificate and internal settings

These final three advanced questions have no visibility condition, so plain
mode asks them even when an external proxy owns TLS:

| Exact question | Default | What to do |
|---|---|---|
| **Extension installer origin** | `http://fs-extension-installer:8099` | Keep the default unless you maintain a deliberate internal topology. It is an internal HTTP origin, not your public domain; it needs an explicit port and no credentials/path/query. It is not an AI provider setting. |
| **Certificate path** | `.ssl/cert.pem` | With provided TLS: path to your PEM certificate/chain. With generated TLS: output location inside the checkout. With ingress-owned TLS, this does not configure the external certificate owner. |
| **Private key path** | `.ssl/key.pem` | Matching PEM private-key input for provided TLS, or generated key output inside the checkout. Keep the key private. |

For provided TLS, the certificate must be valid for the public host and match
the key. Inspect certificate metadata without printing the private key:

```bash
openssl x509 -in /path/to/fullchain.pem -noout -subject -issuer -dates -ext subjectAltName
```

For input files outside the checkout, pass absolute paths at launch; merely
typing them into the form cannot add the required container mounts:

```bash
./install.sh --plain --tls-mode provided \
  --certificate-path /home/deploy/tls/fullchain.pem \
  --private-key-path /home/deploy/tls/privkey.pem
```

The launcher mounts those existing inputs read-only. Generated certificate/key
output must stay inside the checkout. Relative paths must stay inside it too.
The generated local certificate is for controlled local/private use: install
appropriate trust on your own client if needed, and do not treat a browser
certificate warning as a completed public HTTPS deployment.

## Review, install, and create the first administrator

Review the answers, then answer Yes to **Apply this change?** The installer
checks Docker, disk, network/ports and source material, writes installation
state and durable secrets, prepares images, starts dependencies/runtime,
checks schema and worker identity, and verifies health, storage and routing.
It does not ask for an AI-provider API key or an administrator password during
this questionnaire. The first image build can take time; keep the session open.

On a normal checkout installation, including loopback, successful output contains **NEXT STEP: CREATE
THE FIRST ADMINISTRATOR** and a one-time URL ending in
`/bootstrap#setup-token=...`. Open the complete link privately within **60
minutes** for this checkout installer. The token is also written to the
owner-only `.flow-steward/secret-output/bootstrap-token` by default. The complete
link goes to terminal stderr rather than the JSON result; do not publish
terminal recordings containing it. Do not replace the complete link with a plain
`/bootstrap` URL: normal installed bootstrap still requires the setup token on
loopback. Create the first administrator in the browser,
then sign in at `/login`.

If no administrator exists and the token expires, rerun the same `./install.sh`
to issue a replacement. Do not use a stale link after replacement. The 60-minute
checkout-installer lifetime is different from the standalone Compact startup
link described in provider-specific installation instructions.

On a Linux VPS, review [Linux VPS automatic startup](installation#linux-vps-automatic-startup)
for the Compact systemd service, required sudo access, and explicit stop/start
policy. Do not run the installer itself as root or with sudo.

Verify from the checkout:

```bash
./flow-steward status
./flow-steward doctor
```

`status` gives the short readiness summary; `doctor` lists every core check
and separates optional warnings (for example, no AI provider yet) from real
problems.

Then check **from your browser on another machine**, using your real public
URL: open `https://flow.example.com/` (the sign-in page should load without a
certificate warning) and `https://flow.example.com/health/ready` (it should
report ready).

For local generated TLS, use your configured local certificate trust instead
of treating an insecure certificate bypass as proof of production readiness.
Open the UI, create/sign into the account, and run a small workflow. For an
external proxy, also exercise streaming/job-progress WebSockets and, if you
use MCP, its authenticated connection and discovery route. A protected MCP
request may legitimately require authorization; a proxy-generated 404 on the
discovery path indicates a routing problem.

In existing reverse-proxy mode the installer checks the private HTTP backend;
it does not prove that your external HTTPS virtual host, public DNS, certificate
chain, or firewall is correct. Complete those public checks yourself. Follow the
[Deployment Checklist](deployment-checklist) before keeping valuable data.

## Resume and troubleshoot without discarding data

Rerun `./install.sh` from the **same checkout** after a recoverable failure.
The installer classifies the state before acting. A fresh installation asks
questions; a resumable one uses its recorded configuration, asks nothing, and
checks each step's postconditions. An installed one verifies the installation,
starts stopped services and, when the checkout has moved to a newer commit,
rebuilds and updates it (prints `Updated from <old> to <new>.`). Rerunning is
therefore not a read-only diagnostic—use `status` and `doctor` to inspect first.
See [Installation and Updates](../user/installation-and-updates#update-a-checkout-installation)
before updating.

A rerun does not ask the questions again and does not change your answers. On
an installed Compact the only option it applies is `--worker-processes`; any
other option that differs from the installed value stops with
`installed_setting_not_applied` (`--deployment-profile` switches the profile).

Do not remove `.flow-steward`, environment files, or Docker volumes to get past
an error. Their relationship identifies your installation and its durable keys.
An `ambiguous` or `recovery_required` result intentionally preserves resources;
read the reported cause and use `./flow-steward doctor` before further action.

| Symptom | What to check / next action |
|---|---|
| Docker missing, unreachable, or Compose missing | Repeat the three Docker prerequisite checks under the installer account; start Docker or correct installation/socket permissions. |
| `remote_docker_unsupported` | Run on the host with its supported local Docker context. |
| Port in use | Inspect `ss -ltnp` and Docker published ports. For bundled ingress check both Public port and Plain-HTTP redirect port; for a host proxy check private backend ports. |
| `validation_failed` for ingress/TLS | Use a compatible pair from the route table; the TLS menu itself is not filtered. Compact also requires Production. |
| `unsupported_architecture` | The host is not amd64 or arm64. Use a supported server. |
| `insufficient_disk_space` | Free at least 4 GiB in the checkout's file system and rerun. |
| `cancelled` | You answered No at **Apply this change?**, or ran a fresh non-interactive install without `--confirm`. |
| `installed_setting_not_applied` | You passed an option that a rerun does not change. Rerun without it; on Scalable use `./flow-steward config set` and `config apply --confirm`. |
| `release_migration_required` | The update carries a database migration; follow [Update a checkout installation](../user/installation-and-updates#update-a-checkout-installation). |
| `repository_unreadable` | Required files of the checkout are missing or unreadable; restore the checkout and rerun. |
| `traefik_network_missing` / `traefik_network_unattached` | Verify the exact existing network and the running proxy's membership. An empty network cannot route the site. |
| Traefik default certificate or no router | Recheck hostname, DNS, entrypoint spelling, Docker provider/constraints, network selection, and resolver or loaded certificate. |
| S3 credential failure | Check file path/mount, regular-file status, private permissions, and installer JSON keys; do not print credentials in logs. |
| S3 probe failure | Verify endpoint, region, bucket and write/read/delete permissions; confirm the storage service is reachable from the deployment. |
| Apache/Nginx 502 | Verify Host vs Docker placement and backend table. `127.0.0.1` inside a proxy container is not the VPS host. |
| MCP works poorly or discovery returns 404 on Scalable | Route both `/mcp` and the OAuth protected-resource discovery prefix to the MCP backend; preserve authorization and streaming. |
| UI loads but live job progress fails | Check Nginx Upgrade headers or Apache's `/ws/` rule and WebSocket tunnel module. |
| Wrong client/protocol or HTTPS redirect behavior | Verify forwarded headers and Trusted proxy CIDRs using the actual immediate peer, including Docker translation. |
| `public_route` failure with Docker external proxy | See the known readiness mismatch in the Docker-proxy branch; retain state and log instead of deleting volumes. |
| Expired first-admin link | If still no administrator, rerun the installer for a new link. |
| `installer_operation_active` | Wait for the current operation; do not run two installers or delete its lock manually. |

Default operator-relevant paths, relative to the checkout, are:

| Path | Purpose |
|---|---|
| `.flow-steward/install-state.json` | Installer journal and completed/failed steps |
| `.flow-steward/logs/install-*.log` | Owner-only installer logs; use the exact log path printed on failure |
| `.flow-steward/stack.toml` | Active non-secret deployment settings (your answers) |
| `.flow-steward/pending-config.json` | Pending configuration changes, when present |
| `.flow-steward/compose.env` | Generated Compose values; rewritten on every run; can contain sensitive runtime settings |
| `.env.prod` / `.env` | Production/development environment, created by the installer, including generated passwords and keys |
| `.flow-steward/runtime/` | Runtime material, including bundled-storage/bootstrap state |
| `.flow-steward/secret-output/bootstrap-token` | Private first-administrator setup token |
| `.ssl/cert.pem` / `.ssl/key.pem` | Default local/provided certificate paths |

Do not edit these by hand. The installer rewrites the keys it owns in
`.env.prod` (or `.env`) and regenerates `compose.env` on every run, so a manual
change to them is lost or no longer matches the running containers. Change
settings with `./flow-steward config set` and `config apply --confirm`
(Scalable), `./install.sh --worker-processes N` (Compact), or a profile switch.
Back up `.env.prod` together with the database: it holds the keys that decrypt
stored secrets.

A deliberately configured `FS_INSTALLER_STATE_DIR` changes the installer state
root; follow the printed paths. Do not include secret files in support
messages. Share the error code, failed step, profile, ingress choice and a
reviewed/redacted log excerpt.

This walkthrough was checked against the installer source. No fresh VPS
installation, external proxy deployment, ACME issuance, or S3 service was
operated during this documentation review.
