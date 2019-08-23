# $name
###  A customizable lightdm-webkit2-greeter interface

## Examples

## Installation
Install the lightdm and its webkit greeter, make sure that no other version of lightdm is installed on your system.

If your are not already using lightdm, install `lightdm` and `lightdm-webkit2-greeter`.

#### Arch
`$ pacman -S lightdm lightdm-webkit2-greeter`

Now edit the lightdm config, in `/etc/lightdm/lightdm.conf` and set it to use the webkit2 greeter instead.
```
[Seat:*]
...
greeter-session=lightdm-webkit2-greeter
...
```


Next clone the this repo and copy it to the webkit2 themes folder. (You will need
root permission for the copy)

```
$ git clone https://github.com/jelenis/$name.git
# cp -r lightdm-theme /usr/share/lightdm-webkit/themes/
```

Lastly, set the value of theme in `/etc/lightdm/lightdm-webkit2-greeter.conf` to $name

```
[greeter]
...
webkit_theme = $name
```
## Usage
### Event API
### Plugins
