<img align="right" alt="App icon" src="client/assets/icons/android-chrome-384x384.png" height="150px">

# HQhero

Your quiz hero. A lightweight and responsive frontend 
for a quiz prediction robot.

## Technicals
HQhero uses WebSockets to transmit the information quickly, easily, and efficiently.

Requires a quiz processor to transmit answer predictions and other
information about the game to the backend. The processor sends events 
to the hero on the backend, where he will then broadcast those events 
to all connected users.

hqhero.com uses [herobrain](https://github.com/freshollie/herobrain) as a processor.

## Deployment

Deploying this webapp as a container is the recommended practice.

[herobrain](https://github.com/freshollie/herobrain) should be pointed
towards your hqhero service.

HQhero is designed to only have a single service running. It is
designed with a reverse proxy in mind for routing. Multiple HQhero 
services can be configured to represent different quiz regions and
then routed to via a reverse proxy.

In this example, hqhero is designed for /uk /us and /de.

## License

HQhero is released under the MIT license

## Credits

- Oliver Bell - Backend, System Architecture, DevOps
- Eddie Reeder - App design, Animations, Logo
