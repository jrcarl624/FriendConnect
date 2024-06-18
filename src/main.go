package main

import (
    "fmt"
    "net"
    "strings"
    "strconv"
    "time"
)

// BedrockPing represents a ping response from a Bedrock server
type BedrockPing struct {
    ServerID       string
    GameType       string
    ProtocolVersion int
    VersionName    string
    PlayersCurrent int
    PlayersMax     int
    Motd           string
}

func pingBedrockServer(address string) (*BedrockPing, error) {
    // Create a UDP address
    udpAddr, err := net.ResolveUDPAddr("udp4", address)
    if err != nil {
        return nil, err
    }

    // Dial the UDP address
    conn, err := net.DialUDP("udp4", nil, udpAddr)
    if err != nil {
        return nil, err
    }
    defer conn.Close()

    // Send the ping packet
    pingPacket := []byte{
        0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01,
    }
    _, err = conn.Write(pingPacket)
    if err != nil {
        return nil, err
    }

    // Set a read deadline
    conn.SetReadDeadline(time.Now().Add( 20* time.Second))

    // Read the response
    response := make([]byte, 512)
    n, _, err := conn.ReadFromUDP(response)
    if err != nil {
        return nil, err
    }

    // Parse the response
    if n < 35 {
        return nil, fmt.Errorf("response too short")
    }
    responseID := response[0]
    if responseID != 0x1c {
        return nil, fmt.Errorf("invalid response id: %x", responseID)
    }

    // Decode the data
    data := response[35:n]
    info := string(data)
    parts := strings.Split(info, ";")
    if len(parts) < 6 {
        return nil, fmt.Errorf("invalid response data")
    }

    protocolVersion, _ := strconv.Atoi(parts[2])
    playersCurrent, _ := strconv.Atoi(parts[4])
    playersMax, _ := strconv.Atoi(parts[5])

    return &BedrockPing{
        ServerID:       parts[0],
        GameType:       parts[1],
        ProtocolVersion: protocolVersion,
        VersionName:    parts[3],
        PlayersCurrent: playersCurrent,
        PlayersMax:     playersMax,
        Motd:           parts[7],
    }, nil
}

func main() {
    address := "tailvile.xyz:19132" // Replace with the actual server address

    ping, err := pingBedrockServer(address)
    if err != nil {
        fmt.Println("Error pinging server:", err)
        return
    }

    fmt.Printf("Server ID: %s\n", ping.ServerID)
    fmt.Printf("Game Type: %s\n", ping.GameType)
    fmt.Printf("Protocol Version: %d\n", ping.ProtocolVersion)
    fmt.Printf("Version Name: %s\n", ping.VersionName)
    fmt.Printf("Players: %d/%d\n", ping.PlayersCurrent, ping.PlayersMax)
    fmt.Printf("MOTD: %s\n", ping.Motd)
}