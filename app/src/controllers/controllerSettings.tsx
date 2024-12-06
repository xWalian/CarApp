// ControllerSettings.tsx
import React, {useEffect, useState} from 'react';
import {Button, StyleSheet, Text, TextInput, View} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {RootStackParamList} from "../../../App.tsx";
import {StackNavigationProp} from "@react-navigation/stack";


type ControllerScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Controller'>;

type ControllerScreenProps = {
    navigation: ControllerScreenNavigationProp;
};

const validateURL = (url: string): boolean => {
    const regex = /^(ftp|http|https):\/\/[^ "]+$/;
    return regex.test(url);
};

const ControllerScreen: React.FC<ControllerScreenProps> = ({navigation}) => {
    const [url, setUrl] = useState<string>('');
    const [socketIp, setSocketIp] = useState<string>('');
    const [socketPort, setSocketPort] = useState<string>('');
    const [error, setError] = useState<string>('');

    const saveUrl = async () => {
        if (url.length > 0)

        await AsyncStorage.setItem('serverUrl', url);
        await AsyncStorage.setItem('serverSocketIp', socketIp);
        await AsyncStorage.setItem('serverSocketPort', socketPort);
        navigation.navigate('Home');
    };

    const loadUrl = async () => {
        try {
            const savedUrl = await AsyncStorage.getItem('serverUrl');
            const savedSocketUrl = await AsyncStorage.getItem('serverSocketIp');
            const savedSocketPort = await AsyncStorage.getItem('serverSocketPort');
            console.debug("url", savedUrl);
            if (savedUrl) {
                setUrl(savedUrl);
            }
            if (savedSocketUrl) {
                setSocketIp(savedSocketUrl);
            }
            if (savedSocketPort) {
                setSocketPort(savedSocketPort)
            }
        } catch (error) {
            console.error('Error loading URL:', error);
        }
    };


    useEffect(() => {
        loadUrl();
    }, []);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Wprowadź port serwera video</Text>
            <TextInput
                style={[styles.input, error ? styles.errorInput : null]}
                placeholder="Wprowadź port"
                value={url}
                onChangeText={(text) => {
                    setUrl(text);
                    setError('');
                }}
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <Text style={styles.title}>Wprowadź socket serwera</Text>
            <TextInput
                style={[styles.input]}
                placeholder="Wprowadź IP"
                value={socketIp}
                onChangeText={(text) => {
                    setSocketIp(text);
                    setError('');
                }}
            />
            <TextInput
                style={[styles.input]}
                placeholder="Wprowadź port"
                value={socketPort}
                onChangeText={(text) => {
                    setSocketPort(text);
                    setError('');
                }}
            />
            <Button title="Zapisz" onPress={saveUrl}/>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#222',
        padding: 20,
    },
    title: {
        fontSize: 24,
        textAlign: 'center',
        marginBottom: 20,
        color: '#fff',
    },
    input: {
        height: 40,
        borderColor: '#ccc',
        borderWidth: 1,
        marginBottom: 20,
        paddingHorizontal: 10,
        width: '100%',
    },
    errorInput: {
        borderColor: 'red',
    },
    errorText: {
        color: 'red',
        textAlign: 'center',
        marginBottom: 10,
    },
    text: {
        textAlign: 'center',
        marginTop: 20,
        color: '#fff',
    },
});

export default ControllerScreen;
