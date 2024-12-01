import React, { useEffect, useState, useRef } from 'react';
import { View, Image, StyleSheet, Text } from 'react-native';
import dgram from 'react-native-udp';
import { Buffer } from 'buffer';
import FastImage from 'react-native-fast-image';

global.Buffer = global.Buffer || Buffer;

const VideoClient = () => {
    const [frameCount, setFrameCount] = useState(0);
    const [imageSource, setImageSource] = useState<string | null>(null);
    const prevFrameRef = useRef<string | null>(null);

    const port = 12346;
    const host = 'inz.local';

    useEffect(() => {
        const socket = dgram.createSocket({ type: 'udp4' });

        // socket.setRecvBufferSize(10 * 1024 * 1024);  // Set buffer size to 10MB

        socket.bind(port, () => {
            console.log(`UDP socket listening on ${host}:${port}`);
        });

        let animationFrame: number;
        socket.on('message', (msg) => {
            cancelAnimationFrame(animationFrame);
            animationFrame = requestAnimationFrame(() => {
                const base64String = `data:image/jpeg;base64,${Buffer.from(msg).toString('base64')}`;
                setImageSource(base64String);
            });
        });

        return () => {
            socket.close();
            console.log('Socket closed.');
        };
    }, []);

    return (
        <View style={styles.container}>
            {imageSource && (
                <FastImage
                    source={{ uri: imageSource }}
                    style={styles.image}
                    resizeMode={FastImage.resizeMode.cover}
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
        width: 400,
        height: 400,
        transform: [],
    },
    counterText: {
        marginTop: 20,
        color: 'white',
        fontSize: 18,
    },
});

export default VideoClient;
