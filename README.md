# aframe-portals

[![Latest NPM release](https://img.shields.io/npm/v/aframe-portals.svg)](https://www.npmjs.com/package/aframe-portals)
[![Minzipped size](https://badgen.net/bundlephobia/minzip/aframe-portals)](https://bundlephobia.com/result?p=aframe-portals)
[![License](https://img.shields.io/badge/license-MIT-007ec6.svg)](https://github.com/ryota-mitarai/aframe-portals/blob/master/LICENSE)

An [aframe](https://github.com/aframevr/aframe) component for creating portals.

![Example gif](https://github.com/ryota-mitarai/aframe-portals/blob/master/examples/preview.gif)

## Usage

To create a portal, add the **portal** component.

Link portals by setting the _destination_ property.

Set the recursion level by setting the _maxRecursion_ property on one of the portals.

```html
<a-entity id="portal1" portal="destination: #portal2; maxRecursion: 1" position="-3 1.5 -3"></a-entity>
<a-entity id="portal2" portal="destination: #portal1" position="3 1.5 3"></a-entity>
```

### Properties

| Property         | Description                                                                       | Default |
| ---------------- | --------------------------------------------------------------------------------- | ------- |
| destination      | a CSS selector of the destination portal                                          | ""      |
| width            | width of the portal                                                               | 2       |
| height           | height of the portal                                                              | 3       |
|                  |                                                                                   |         |
| maxRecursion     | how many recursion levels to render - only the highest value in the scene is used | 0       |
| teleportCooldown | cooldown in ms after a teleportation, where the user cannot be teleported         | 100     |
|                  |                                                                                   |         |
| enableTeleport   | enables teleportation when the camera collides with the portal                    | true    |

## Additional Info

Portals have a front and a back. The back is visually broken and should not be exposed to the user.

Increasing _maxRecursion_ takes a huge performance cost. Keep it as low as possible.

Portal teleportation currently doesn't work well if the portals are not aligned with one of the cardinal directions. I will try to fix this in the future, but for the best results, keep portals aligned to 90 degree angles.
