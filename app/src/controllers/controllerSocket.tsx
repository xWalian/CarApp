import React, {useEffect, useRef, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {Socket} from 'react-native-udp'; // Poprawiony import
import {Buffer} from 'buffer';
import FastImage from 'react-native-fast-image';

global.Buffer = global.Buffer || Buffer;

const VideoClient = () => {
    const [frameCount, setFrameCount] = useState(0);
    const [activeIndex, setActiveIndex] = useState(0);
    const imageBuffer = useRef<string[]>(Array(3).fill(null));
    const socketRef = useRef<Socket | null>(null);

    const port = 12346;
    const host = 'inz.local';
    const MIN_IMAGE_SIZE = 1000;

    useEffect(() => {
        if (socketRef.current) return;

        const socket = new Socket({ type: 'udp4' });
        socketRef.current = socket;

        socket.bind(port, () => {
            console.log(`UDP socket listening on ${host}:${port}`);
        });

        socket.on('message', (msg: any) => {
            if (msg.length >= MIN_IMAGE_SIZE) {
                imageBuffer.current[activeIndex] = `data:image/jpeg;base64,${Buffer.from(msg).toString('base64')}`;
                setActiveIndex((prevIndex) => (prevIndex + 1) % 3);
                setFrameCount((prev) => prev + 1);
            }
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.close();
                console.log('Socket closed.');
                socketRef.current = null;
            }
        };
    }, [activeIndex]); // activeIndex jest tu bezpieczny, nie tworzy nowego socketu

    return (
        <View style={styles.container}>
            {imageBuffer.current.map((imageSource, index) => (
                <FastImage
                    key={index}
                    source={{ uri: imageSource }}
                    style={[
                        styles.image,
                        { opacity: index === activeIndex ? 1 : 0 }
                    ]}
                    resizeMode={FastImage.resizeMode.cover}
                />
            ))}
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
        position: 'absolute',
    },
    counterText: {
        marginTop: 20,
        color: 'white',
        fontSize: 18,
    },
});

export default VideoClient;
