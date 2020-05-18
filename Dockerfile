FROM ubuntu:18.04

RUN apt-get update
# Install python
RUN apt update && apt -qq -y upgrade && apt -qq -y install apache2 python3 python3-pip && apt clean && rm -rf /var/lib/apt/lists/*

# Enable CGI scripts
RUN ln -s /etc/apache2/mods-available/cgi.load /etc/apache2/mods-enabled/cgi.load

# Copy Web page contents
COPY ./index.html /var/www/html/
COPY ./thanks.html /var/www/html/
COPY ./assets/ /var/www/html/assets/
COPY ./cgi-bin/ /var/www/html/cgi-bin/
COPY ./js/ /var/www/html/js/
COPY ./survey/ /var/www/html/survey/

# Setup apache
COPY ./apache2.conf /etc/apache2/apache2.conf

# Setup processor script
RUN pip3 install requests
RUN chmod 755 /var/www/html/cgi-bin/processor.py

EXPOSE 80
CMD apachectl -D FOREGROUND