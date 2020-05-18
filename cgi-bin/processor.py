#!/usr/bin/env python3

import requests
import json
from requests.auth import HTTPBasicAuth
from cgi import FieldStorage
from pathlib import Path
from datetime import datetime
import cgi
import os

# Setup
passphrase_key = 'submission.passphrase' # page.name
passphrase_value = 'foo'

# Variables
data = {}

print("Content-Type: text/html, charset=\"utf-8\"")
print() # very important whitespace

# Get data from form
form = FieldStorage(encoding='utf-8', keep_blank_values=True)
if len(form.keys()) <= 0: # check for non-empty form
	exit()

# Check passphrase
if not form.getfirst(passphrase_key, '') == passphrase_value:
	print("Incorrect passphrase, try <a href='/?page=-1'>again</a>! Your data is still entered.") 
	exit()

# Store data from form in dict
data['form'] = {}
form_data = data['form']
for key in form.keys():
	if not key == passphrase_key:
		form_data[key] = form.getfirst(key, '').replace('\r\n', '\n')

# Add IP address of client
data['meta'] = {}
meta_data = data['meta']
meta_data['ip'] = cgi.escape(os.environ["REMOTE_ADDR"])

# Prepare PUT
headers = {'Content-type': 'application/json; charset=utf-8'}
url = 'foo' + datetime.now().strftime('%Y-%m-%d-%H-%M-%S-%f') + '.json' # extension
token = 'foo'

# Perform PUT
request = requests.put(
	url,
	data=json.dumps(data, ensure_ascii=False, indent=2, sort_keys=True).encode('utf-8'),
	headers=headers,
	auth=HTTPBasicAuth(token, '')) # token as username
# print(request.text) # print message from server
# print("Form sent!")

print("""
<html>
	<head>
		<meta http-equiv="refresh" content="0;url=../thanks.html" />
		<title>You are going to be redirected</title>
	</head>
	<body>
		Redirecting... <a href="../thanks.html">Click here if you are not redirected</a>
	</body>
</html>
""")