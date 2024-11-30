import React, { useEffect, useState } from 'react';
import { View, Image, StyleSheet, Text } from 'react-native';
import dgram from 'react-native-udp';
import { Buffer } from 'buffer';

global.Buffer = global.Buffer || Buffer;
const VideoClient = () => {
    const [imageSource, setImageSource] = useState<string | null>(null);
    const [frameCount, setFrameCount] = useState(0);
    const port = 12346;
    const host = 'inz.local'; // Adres serwera - zmień na odpowiedni

    useEffect(() => {
        const socket = dgram.createSocket({ type: 'udp4' });

        // Zwiększ rozmiar bufora odbioru
        socket.setRecvBufferSize(10 * 1024 * 1024);  // Ustawienie 10MB bufora

        socket.bind(port, () => {
            console.log(`UDP socket listening on ${host}:${port}`);
        });

        socket.on('message', (msg, rinfo) => {
            // Logowanie przychodzących danych
            console.log(`Received ${msg.length} bytes from ${rinfo.address}:${rinfo.port}`);

            // Sprawdzamy, czy otrzymano dane
            if (msg.length > 0) {
                console.log(`Received frame!`);
                const base64String = `data:image/jpeg;base64,${Buffer.from(msg).toString('base64')}`;
                setImageSource(base64String);
                setFrameCount((prevCount) => prevCount + 1);
            }
        });

        socket.on('listening', () => {
            const address = socket.address();
            console.log(`Socket listening on ${address.address}:${address.port}`);
        });

        socket.on('error', (err) => {
            console.error(`Socket error: ${err.message}`);
        });

        // Zamknięcie gniazda po odmontowaniu komponentu
        return () => {
            socket.close();
            console.log('Socket closed.');
        };
    }, []);

    return (
        <View style={styles.container}>
            {imageSource && (
                <Image
                    source={{ uri: imageSource }}
                    style={styles.image}
                    resizeMode="contain"
                />
            )}
            <Text style={styles.counterText}>
                Frames Received: {frameCount}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: '100%',
        height: '80%',
    },
    counterText: {
        marginTop: 20,
        color: 'white',
        fontSize: 18,
    },
});

export default VideoClient;