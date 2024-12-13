import React, {useEffect, useRef, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import dgram from 'react-native-udp';
import {Buffer} from 'buffer';
import FastImage from 'react-native-fast-image';

global.Buffer = global.Buffer || Buffer;

interface VideoClientProps {
    port?: number
}

const VideoClient = ({port}: VideoClientProps) => {
    const [frameCount, setFrameCount] = useState(0);
    const [activeIndex, setActiveIndex] = useState(0);
    const imageBuffer = useRef<string[]>(Array(3).fill(null));
    const socketRef = useRef<any | null>(null);

    const host = 'inz.local';
    const MIN_IMAGE_SIZE = 1000;

    useEffect(() => {
        if (!port || socketRef.current) return;

        const socket = dgram.createSocket({type: 'udp4'});
        socketRef.current = socket;

        socket.on('listening', () => {
            console.log(`UDP socket listening on ${host}:${port}`);
        });

        socket.bind(port);

        socket.on('message', (msg: Buffer) => {
            if (msg.length >= MIN_IMAGE_SIZE) {
                imageBuffer.current[activeIndex] = `data:image/jpeg;base64,${msg.toString('base64')}`;
                setActiveIndex((prevIndex) => (prevIndex + 1) % 3);
                setFrameCount((prev) => prev + 1);
            }
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.close();
                socketRef.current = null;
            }
        };
    }, [port, activeIndex]);


    return (
        <View style={styles.container}>
            {imageBuffer.current.map((imageSource, index) => (
                <FastImage
                    key={index}
                    source={{uri: imageSource}}
                    style={[
                        styles.image,
                        {opacity: index === activeIndex ? 1 : 0}
                    ]}
                    resizeMode={FastImage.resizeMode.cover}
                />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
    },
    image: {
        width: 500,
        height: 500,
        position: 'absolute',
    },
    counterText: {
        marginTop: 20,
        color: 'white',
        fontSize: 18,
    },
});

export default VideoClient;
