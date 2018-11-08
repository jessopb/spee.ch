# Create Your Own Spee.ch on DigitalOcean

## i. Overview

* Prerequisites
  * UBUNTU 16+ VPS with root access
    * Your login info ready
  * Domain name with @ and www pointed at your VPS IP
  * Email Address
  * Ability to send 5+ LBRY credits to an address
  * Noncommercial use
  * We recommend that you fork Spee.ch so that you can customize the site.

* You'll be installing:
  * MYSQL DB
    * Default Port
  * NODE v8+
  * HTTPS PROXY SERVER
    * Caddy for personal use
  * SPEE.CH
  * LBRYNET DAEMON


## 1. Update OS and install tools
* OS
  * `sudo apt update -y`

* Git
  * `sudo apt install git -y`
  * git --version

* NODE v8
  * `wget -qO- https://deb.nodesource.com/setup_8.x | sudo -E bash -`
  * `sudo apt-get install -y nodejs`
  * node --version (8.x)
  * npm --version (6.x)

* Curl, Tmux, Unzip
  * `sudo apt install curl tmux unzip ffmpeg -y`
  * curl --version
  * tmux --version
  * unzip --version
  * ffmpeg --version
* Grab config files
  * `git clone https://github.com/jessopb/speechconfigs.git`
  * `chmod 640 -R ~/speechconfigs`
* Update ulimit for production server
  * `ulimit -n 8192`



### 2a. Secure the UFW firewall
* UFW
  * `sudo ufw status`
  * `sudo ufw allow 80`
  * `sudo ufw allow 443`
  * `sudo ufw allow 22`
  * `sudo ufw allow 3333`
  * `sudo ufw allow 4444`
  * `sudo ufw default allow outgoing`
  * `sudo ufw default deny incoming`
  * `sudo ufw show added`
  * `sudo ufw enable` (yes, you've allowed ssh 22)
  * `sudo ufw status`

### 2b. Install Caddy to handle https and reverse proxy
* Caddy
  * `curl https://getcaddy.com | bash -s personal`
  * `mkdir -p /opt/caddy/logs/`
  * `mkdir -p /opt/caddy/store/`
  * `cp ~/speechconfigs/caddy/Caddyfile.speechsample ~/speechconfigs/caddy/Caddyfile`
  * `nano ~/speechconfigs/caddy/Caddyfile`
    * CHANGE EXAMPLE.COM to YOURDOMAIN.COM
  * `cp ~/speechconfigs/caddy/Caddyfile /opt/caddy/`
  * `cp ~/speechconfigs/caddy/caddy.service /etc/systemd/system/caddy.service`
  * `chmod 644 /etc/systemd/system/caddy.service`
  * `chown -R www-data:www-data /opt/caddy/`
  * `setcap 'cap_net_bind_service=+ep' /usr/local/bin/caddy`
  * `systemctl daemon-reload`
  * `systemctl start caddy`
  * `systemctl status caddy`


### 3 Set up MySql
* Install MySql
  * `sudo apt update`
  * `sudo apt install mysql-server -y`
    * enter blank password each time
  * `sudo systemctl status mysql` (q to exit)
* Secure Install
  * `sudo mysql_secure_installation`
    * No to password validation
    * Y to all other options
    * password abcd1234
* Login to mysql from root:
  * `mysql` to enter mysql> console
  * mysql> `ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'abcd1234';`
  * mysql> `FLUSH PRIVILEGES;`
  * Control+D to exit

### 4 Add Lbrynet

## TODO: Enable something like sudo systemctl start lbrynet so it runs as www-data

* tmux
  * Ctrl+b, d detaches leaving session running.
  * ~# `tmux`, Ctrl+b, ( goes back to that session.
* Get the daemon
  * ~# `wget -O ~/latest_daemon.zip https://lbry.io/get/lbrynet.linux.zip`
  * ~# `unzip -o -u ~/latest_daemon.zip`
* Start the daemon
  * ~# `./lbrynet start`
* detatch tmux session
  * you can `Control+b, then d` to leave lbrynet daemon running and exit the session
  * `tmux, Control+b, then )` to cycle back to your lbrynet session to see output
  ### SHOULD BE OPTIONAL: DISPLAY WALLET ADDRESS, INVITE TO SEND 5+ LBC.
  * Check out the current commands:
    * ./lbrynet commands
* Get your wallet address
  * ./lbrynet address-list
* Send LBC to an address, wait a few minutes then check:
  * ./lbrynet account_balance

### 4
* Mysteriously Missing

### 5 Set up spee.ch
* TODO: Enable something like sudo systemctl start speech
(add proper git workflow and ssh)
* Clone speech from github
  * Your own fork?
    * SSH key for example added to github?
      * git clone git@github.com:{{youraccount}}/spee.ch
    * HTTPS?
      * `git clone https://github.com/{{youraccount}}/spee.ch.git`
  * Basic spee.ch
    * `git clone https://github.com/lbryio/spee.ch`
* Build it
  * ~# `cd spee.ch`
  * ~/spee.ch# `npm install`
  * Be sure you have a chainqueryConfig.json in spee.ch/cli/defaults/chainqueryConfig.json
    * TO BE INCLUDED:
    * `cp ~/speechconfigs/speech/chainqueryConfig.json ~/spee.ch/site/defaults/chainqueryConfig.json`
  * ~/spee.ch# `npm run configure` (once your wallet balance has cleared)
    * DATABASE: lbry
    * USER NAME: root
    * PASSWORD: abcd1234
    * PORT: 3000
    * Site Title: Example Speech Site
    * Enter your site's domain: https://freezepeach.fun (this must include https://)
    * Enter a directory where uploads should be stored: (/home/lbry/Uploads)

* Run it:  //Replace this with placing the bundle.js?
  * ~/spee.ch/# npm run start

### 6 Maintenance Proceedures
* Change wallet
  * TODO
* Change daemon
  * wget daemon from https://github.com/lbryio/lbry/releases
  * wget --quiet -O ~/your_name_daemon.zip https://your_copied_file_path.zip
  * rm ./lbrynet
  * unzip -o -u ~/your_name_daemon.zip

### 7 TODO
* Don't run as root
* Get a clear idea what ports are necessary when not behind NAT
* Use Dockerized Spee.ch and Lbrynet
  * https://github.com/lbryio/lbry-docker/tree/master/www.spee.ch
  * https://github.com/lbryio/lbry-docker/tree/master/lbrynet-daemon
  * https://blog.hasura.io/an-exhaustive-guide-to-writing-dockerfiles-for-node-js-web-apps-bbee6bd2f3c4
  * https://docs.traefik.io/user-guide/docker-and-lets-encrypt/
  * https://docs.traefik.io/configuration/acme/
* Systemd unit files
  * https://nodesource.com/blog/running-your-node-js-app-with-systemd-part-1/
  * Spee.ch
    * sudo nano /lib/systemd/system/speech.service
  * Lbrynet
    * sudo nano /lib/systemd/system/lbrynet.service
    ```
    [Unit]
    Description=hello_env.js - making your environment variables rad
    Documentation=https://example.com
    After=network.target

    [Service]
    Environment=NODE_PORT=3001
    Type=simple
    User=ubuntu
    ExecStart=node path/server.js
    Restart=on-failure

    [Install]
    WantedBy=multi-user.target
    ```
* Provide spee.ch build releases?
* Provide system to configure chainqueryConfig.json
* Clone speech to stripped version, streamline customization
* Automate for testing
