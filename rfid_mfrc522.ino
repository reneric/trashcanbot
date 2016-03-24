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


#include "MFRC522/MFRC522.h"

#define SS_PIN A2
#define RST_PIN D2

MFRC522 mfrc522(SS_PIN, RST_PIN); // Create MFRC522 instance.

void setup() {
  Serial.begin(9600);
  while (!Serial.available()) SPARK_WLAN_Loop();

  mfrc522.setSPIConfig();
  mfrc522.PCD_Init();
  Serial.println("Scan PICC to see UID and type...");
}

void loop() {
  // Look for new cards
  if ( ! mfrc522.PICC_IsNewCardPresent()) {
    return;
  }

  // Select one of the cards
  if ( ! mfrc522.PICC_ReadCardSerial()) {
    return;
  }

  // Dump debug info about the card. PICC_HaltA() is automatically called.
  mfrc522.PICC_DumpToSerial(&(mfrc522.uid));
}
