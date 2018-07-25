# HQhero

HQhero is a frontend to the quiz answering machine hqhero-machine. The website gets input from an
answering robot and forwards the information onto the clients.

## Technicals
HQhero uses WebSockets to transmit the information quickly, easily, and efficiently.

HQhero requires a backend as a processor. The processor sends events 
to hqhero, where hqhero will then broadcast those events to all connected users.

hqhero.com uses herobrain as a processor.

The frontend of HQhero is a single page Angular 6 application, mostly for ease of 
development.

## License

HQhero is released under the MIT license

## Credits

- Oliver Bell - Serverside, System Architecture, DevOps
- Eddie Reeder - Frontend design, Animations, Logo
