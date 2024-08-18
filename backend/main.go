package main

import (
	"encoding/json"
	"log"
	"strconv"
	"sync"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/websocket/v2"
)

var (
	flagArray    []int
	mutex        sync.RWMutex
	itemsChecked int
)

func main() {
	app := fiber.New()

	flagArray = make([]int, 1000000)

	app.Get("/ws", websocket.New(func(c *websocket.Conn) {
		defer c.Close()

		if err := sendFlagArray(c); err != nil {
			log.Println("Error sending initial flag array:", err)
			return
		}

		for {
			_, msg, err := c.ReadMessage()
			if err != nil {
				log.Println("read:", err)
				break
			}

			index, err := strconv.Atoi(string(msg))
			if err != nil {
				log.Println("invalid index:", err)
				continue
			}

			if index < 0 || index >= len(flagArray) {
				log.Println("index out of range:", index)
				continue
			}

			mutex.Lock()
			log.Println("index:", index, "value:", flagArray[index])
			if flagArray[index] == 0 {
				flagArray[index] = 1
				itemsChecked++
				log.Println("index updated:", index)

				if err := sendFlagArray(c); err != nil {
					log.Println("Error sending updated flag array:", err)
					mutex.Unlock()
					break
				}
			}
			mutex.Unlock()
		}
	}))

	log.Fatal(app.Listen(":4000"))
}

func sendFlagArray(c *websocket.Conn) error {

	jsonData, err := json.Marshal(struct {
		FlagArray    []int `json:"flagArray"`
		ItemsChecked int   `json:"itemsChecked"`
	}{
		FlagArray:    flagArray,
		ItemsChecked: itemsChecked,
	})
	if err != nil {
		return err
	}

	return c.WriteMessage(websocket.TextMessage, jsonData)
}
