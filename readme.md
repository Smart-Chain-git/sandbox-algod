# Sandbox

## Installation
```
install https://github.com/algorand/sandbox
npm install algosdk
source .env
```
## See account list
```
./sandbox goal account list
```
## Enter algod container
```
./sandbox enter algod
```
## Export private key 
```
./sandbox goal account export -a LBLP7MHECZ5FL2JVRCDPLXN25WW3CLQLHDLSAUWNV4CGYAHYBHKNY2WNS4
```
## Launch Sandbox
```
cd sandbox
./sandbox up
```
## destroy Sandbox
```
cd sandbox
./sandbox down
```

## Create a token
```
node assetCreate.js
```



# Debug


```
Add to docker compose
- 9392:9392

Enter sandbox: ./sandbox enter algod

Install socat: apt install socat

Create TEAL script, e.g., echo "int 1" > a.teal

Run tealdbg in the background with new port (e.g., 1234): tealdbg debug --remote-debugging-port 1234 a.teal & socat tcp-listen:9392,reuseaddr,fork tcp:localhost:1234

Redirect port 1234 to 9392 because 1234 is only bound locally (see netstat below): 

Open Chrome Developer tools and visit the address displayed by tealdbg where 1234 is replaced by 9392.

```