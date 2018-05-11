################################
############ HackMD ############
################################

# Create your HackMD passphrase
echo "Create your HackMD passphrase for the MySQL database and press [Enter]. You will create your specific HackMD credentials after the installation."
read -s hackmdpassphrase

# Set your IP address as a variable. This is for instructions below.
IP="$(hostname -I | sed -e 's/[[:space:]]*$//')"

# Install dependencies
sudo yum install epel-release -y
sudo yum install mariadb-server npm gcc-c++ git bzip2 -y

# Stage HackMD for building
sudo npm install -g uws node-gyp tap webpack grunt yarn
sudo yarn add -D webpack-cli
sudo git clone https://github.com/hackmdio/hackmd.git /opt/hackmd/
cd /opt/hackmd
sudo bin/setup
cd -

# Set up the HackMD database
sudo systemctl start mariadb.service
mysql -u root -e "CREATE DATABASE hackmd;"
mysql -u root -e "GRANT ALL PRIVILEGES ON hackmd.* TO 'hackmd'@'localhost' IDENTIFIED BY '$hackmdpassphrase';"

# Update the HackMD configuration files
sudo sed -i 's/"username":\ ""/"username":\ "hackmd"/' /opt/hackmd/config.json
sudo sed -i 's/"password":\ ""/"password":\ "'$hackmdpassphrase'"/' /opt/hackmd/config.json
sudo sed -i 's/5432/3306/' /opt/hackmd/config.json
sudo sed -i 's/postgres/mysql/' /opt/hackmd/config.json
sudo sed -i 's/change\ this/mysql:\/\/hackmd:'$hackmdpassphrase'@localhost:3306\/hackmd/' /opt/hackmd/.sequelizerc

# Build HackMD
sudo npm run build --prefix /opt/hackmd/

# Add the HackMD user with no login
sudo useradd -s /usr/sbin/nologin hackmd

# Set directory permissions for HackMD
sudo chown -R hackmd:hackmd /opt/hackmd

# Creating the HackMD service
sudo bash -c 'cat > /etc/systemd/system/hackmd.service <<EOF
[Unit]
Description=HackMD Service
Requires=network-online.target
After=network-online.target mariadb.service time-sync.target

[Service]
User=hackmd
Group=hackmd
WorkingDirectory=/opt/hackmd
Type=simple
ExecStart=/bin/npm start production --prefix /opt/hackmd/

[Install]
WantedBy=multi-user.target
EOF'

# Prepare the service environment
sudo systemctl daemon-reload

# Configure HackMD services
sudo systemctl enable mariadb.service
sudo systemctl enable hackmd.service

# Configure the firewall
sudo firewall-cmd --add-port=3000/tcp --permanent
sudo firewall-cmd --reload

# Remove gcc
sudo yum -y remove gcc-c++

################################
### Secure MySQL installtion ###
################################
clear
echo "In a few seconds we are going to secure your MariaDB configuration. You'll be asked for your MariaDB root passphrase (which hasn't been set), you'll set the MariaDB root passphrase and then be asked to confirm some security configurations."
sudo sh -c 'echo [mysqld] > /etc/my.cnf.d/bind-address.cnf'
sudo sh -c 'echo bind-address=127.0.0.1 >> /etc/my.cnf.d/bind-address.cnf'
sudo systemctl restart mariadb.service
mysql_secure_installation

###############################
### Clear your Bash history ###
###############################
# We don't want anyone snooping around and seeing any passphrases you set
cat /dev/null > ~/.bash_history && history -c

# Start HackMD service
sudo systemctl start hackmd.service
clear
echo "HackMD has been successfully deployed. Browse to http://$HOSTNAME:3000 (or http://$IP:3000 if you don't have DNS set up) to begin using HackMD."
