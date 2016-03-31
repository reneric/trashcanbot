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
unsigned hour;

boolean trashDay = false;

// Cloud variables and functions
int present = 0;
int sendAlert(String command);

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
    Particle.variable("present", present);
    Particle.function("alert", sendAlert);
    Serial.println("Trash can RFID bot ready...");
}

void loop() {
    // Setup Time
    currentTime = rtc.now();
    day = rtc.dayOfWeekString(currentTime);
    hour = rtc.hour(currentTime);
    trashDay = day == SUNDAY || day == WEDNESDAY;
    currentEpoch = rtc.nowEpoch();
    present = cardPresent();
    // Check if it is trash day
    if (!trashDay) {
        return;
    }

    if (cardPresent()) {
        digitalWrite(D7, HIGH);
        if (hour > 12) {
            // If less than time interval
            if (lastText > 0 && (currentEpoch - lastText) < textInterval) {
                return;
            }

            lastText = currentEpoch;
            sendAlert("all");
            return;
        }
    }

    // Select one of the cards
    if ( ! mfrc522.PICC_ReadCardSerial()) {
        digitalWrite(D7, LOW);
        return;
    }

    printRfid();
}

int sendAlert(String command) {
    Particle.publish("twilio", "Bring the trash to the road!");
    Serial.println("Bring the trash to the road!");
    return 1;
}

boolean cardPresent() {
    if (!mfrc522.PICC_IsNewCardPresent()) {
        if (mfrc522.PICC_IsNewCardPresent()) { // Check again hack
            return true;
        }
    }
    return false;
}

void printRfid() {
    // Dump UID
    String rfid = "";
    for (byte i = 0; i < mfrc522.uid.size; i++) {
        rfid += mfrc522.uid.uidByte[i] < 0x10 ? " 0" : " ";
        rfid += String(mfrc522.uid.uidByte[i], HEX);
    }

    rfid.trim();
    rfid.toUpperCase();

    Serial.println("RDID: " + rfid);
}
