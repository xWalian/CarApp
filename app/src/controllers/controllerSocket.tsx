import React, { useEffect, useState, useRef } from 'react';
import { View, Image, StyleSheet, Text } from 'react-native';
import dgram from 'react-native-udp';
import { Buffer } from 'buffer';
import FastImage from 'react-native-fast-image';

global.Buffer = global.Buffer || Buffer;

const VideoClient = () => {
    const [frameCount, setFrameCount] = useState(0);
    const [imageSource, setImageSource] = useState<string | null>(null);
    const prevFrameRef = useRef<string | null>(null);  // Track the previous image source

    const port = 12346;
    const host = 'inz.local'; // Change to the appropriate server address

    useEffect(() => {
        const socket = dgram.createSocket({ type: 'udp4' });

        // socket.setRecvBufferSize(10 * 1024 * 1024);  // Set buffer size to 10MB

        socket.bind(port, () => {
            console.log(`UDP socket listening on ${host}:${port}`);
        });

        let frameUpdateInterval = 5;  // Co ile klatek aktualizować
        let receivedFrames = 0;

        socket.on('message', (msg, rinfo) => {
            receivedFrames++;
            if (receivedFrames % frameUpdateInterval === 0) {
                const base64String = `data:image/jpeg;base64,${Buffer.from(msg).toString('base64')}`;
                if (base64String !== prevFrameRef.current) {
                    prevFrameRef.current = base64String;
                    setImageSource(base64String);
                    setFrameCount((prevCount) => prevCount + 1);
                }
            }
        });

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
                    resizeMode={FastImage.resizeMode.cover}  // Similar to the 'cover' option in Image
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
        width: 400,        // Fixed width
        height: 400,       // Fixed height
        opacity: 1,        // Ensure no fade-out effect
        transform: [],     // No scaling or other transforms
    },
    counterText: {
        marginTop: 20,
        color: 'white',
        fontSize: 18,
    },
});

export default VideoClient;
