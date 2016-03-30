/*
 *
 * Pin layout should be as follows:
 * Signal     Pin              Pin
 *            Photon           MFRC522 board
 * ---------------------------------------------------------------------------
 * Reset      ANY (D2)         RST
 * SPI SS     ANY (A2)         SDA
 * SPI MOSI   A5               MOSI
 * SPI MISO   A4               MISO
 * SPI SCK    A3               SCK
 *
 */


#include "FMFRC522.h"
#include "SparkTime.h"

UDP UDPClient;
SparkTime rtc;

// Setup datetime variables
unsigned long currentTime;
unsigned long lastTime = 0UL;
String day;
String SUNDAY = "Sunday";
String WEDNESDAY = "Wednesday";
byte hour;

boolean trashDay = false;

// Setup RFID Reader
#define SS_PIN D0
#define RST_PIN D4
MFRC522 mfrc522(SS_PIN, RST_PIN); // Create MFRC522 instance.
String lastRfid = "";

unsigned long lastText = 0UL;
unsigned long currentEpoch = 0UL;
int textInterval = 1800; // In Seconds

void setup() {
    Serial.begin(57600);
    pinMode(D7, OUTPUT);
    rtc.begin(&UDPClient, "north-america.pool.ntp.org");
    rtc.setTimeZone(-6);
    SPI.begin();
    SPI.setClockDivider(SPI_CLOCK_DIV8);
    mfrc522.PCD_Init();

    // Startup communication
    Particle.publish("slackrfid", "Trash can RFID bot ready...");
    Particle.publish("twilio", "Trash can RFID bot ready...");
    Serial.println("Trash can RFID bot ready...");
}

void loop() {
    // Setup Time
    currentTime = rtc.now();
    day = rtc.dayOfWeekString(currentTime);
    hour = rtc.hour(currentTime);
    trashDay = day == SUNDAY || day == WEDNESDAY;
    currentEpoch = rtc.nowEpoch();

    // Check if it is trash day
    if (!trashDay) {
        return;
    }

    if (!mfrc522.PICC_IsNewCardPresent()) {
        if (mfrc522.PICC_IsNewCardPresent()) { // Check again hack
            digitalWrite(D7, HIGH);
            if (hour > 20) {
                // If less than time interval
                if (lastText > 0 && (currentEpoch - lastText) < textInterval) {
                  return;
                }

                lastText = currentEpoch;
                Particle.publish("twilio", "Bring the trash to the road!");
                Serial.println("Bring the trash to the road!");
                return;
            }
        }
    }

    // Select one of the cards
    if ( ! mfrc522.PICC_ReadCardSerial()) {
        digitalWrite(D7, LOW);
        return;
    }

    // Dump UID
    String rfid = "";
    for (byte i = 0; i < mfrc522.uid.size; i++) {
        rfid += mfrc522.uid.uidByte[i] < 0x10 ? " 0" : " ";
        rfid += String(mfrc522.uid.uidByte[i], HEX);
    }

    rfid.trim();
    rfid.toUpperCase();

    // Prevent multiple scans
    // if(rfid==lastRfid)
    //     return;

    lastRfid = rfid;

    // Particle.publish("slackrfid", rfid);
    Serial.println("RDID: " + rfid);
    delay(1000);

}
