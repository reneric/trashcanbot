# Trash Can Bot
## RFID Presence Detection with SMS
The **Trash Can Bot** is powered by a Particle Photon and uses a MFRC522 module for the RFID reader.

I am currently using this to detect my trash can in my garage. The bot is connected to WiFi and will alert me (every 30 minutes), via SMS and Slack, if my trash can is detected after 9pm the night before trash pickup.

*Note: I was unable to get this ported into the Particle IDE and therefore this firmware must be loaded from the Particle CLI*

#### To flash the firmware from the Particle CLI:

  ``` bash
  particle flash DEVICE_ID firmware
  ```

![alt text](http://i.imgur.com/DypbCyD.png "SMS Screenshot Example")
