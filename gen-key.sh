#!/bin/bash
# https://www.rosehosting.com/blog/how-to-generate-a-self-signed-ssl-certificate-on-linux/
# Generates self signed cert for dev purposes
openssl req -newkey rsa:4096 -x509 -sha256 -days 365 -nodes -out local.crt -keyout local.key
openssl rsa -passin pass:x -in keypair.key -out local.key
openssl req -new -key local.key -out local.csr
openssl x509 -req -days 365 -in local.csr -signkey local.key -out local.crt

rm keypair.key
