// App.tsx
import * as React from 'react';
import { NavigationContainer, NavigationProp } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import ControllerScreen from "./app/src/controllers/controllerWindow.tsx";
import { enableScreens } from 'react-native-screens';
import { GestureHandlerRootView } from "react-native-gesture-handler";
import ControllerSettings from "./app/src/controllers/controllerSettings.tsx";
import VideoClient from "./app/src/controllers/controllerSocket.tsx";

import {useEffect} from "react";
import Orientation from 'react-native-orientation-locker';

enableScreens();

interface ButtonProps {
    label: string;
    onPress: () => void;
}

interface HomeScreenProps {
    navigation: NavigationProp<any>;
}

export type RootStackParamList = {
    Home: undefined;
    Controller: undefined;
    Settings: undefined;
};

const Button: React.FC<ButtonProps> = ({ label, onPress }) => {
    return (
        <TouchableOpacity onPress={onPress} style={styles.button}>
            <Text style={styles.buttonText}>{label}</Text>
        </TouchableOpacity>
    );
};

function HomeScreen({ navigation }: HomeScreenProps): React.JSX.Element {
    const isDarkMode = useColorScheme() === 'dark';
    const backgroundStyle = {
        backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
    };
    const handleClick = (screen: string) => {
        navigation.navigate(screen);
    };

    return (
        <View style={[styles.container, backgroundStyle]}>
            <Text style={styles.title}>CarAPP</Text>
            <Button label="Sterowanie" onPress={() => handleClick('Controller')} />
            <Button label="Ustawienia" onPress={() => handleClick('Settings')} />
            <Button label="Socket" onPress={() => handleClick('Socket')} />
        </View>
    );
}

const Stack = createNativeStackNavigator();

function App(): React.JSX.Element {
    useEffect(() => {
        Orientation.lockToPortrait();

        return () => {
            Orientation.lockToLandscape();
        };
    }, []);

    return (
        <NavigationContainer>
            <GestureHandlerRootView>
                <Stack.Navigator initialRouteName="Home">
                    <Stack.Screen
                        name="Home"
                        component={HomeScreen}
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name="Controller"
                        component={ControllerScreen}
                        options={{
                            headerBackTitle: '',
                            headerTransparent: true,
                            headerBackVisible: true,
                            headerTintColor: 'white',
                            title: 'Controller',
                            headerTitleStyle: { color: 'white' },
                        }}
                    />
                    <Stack.Screen
                        name="Settings"
                        component={ControllerSettings}
                        options={{
                            headerBackTitle: '',
                            headerTransparent: true,
                            headerBackVisible: true,
                            headerTintColor: 'white',
                            title: 'Controller Settings',
                            headerTitleStyle: { color: 'white' },
                        }}
                    />
                    <Stack.Screen
                        name="Socket"
                        component={VideoClient}
                        options={{
                            headerBackTitle: '',
                            headerTransparent: true,
                            headerBackVisible: true,
                            headerTintColor: 'white',
                            title: 'New Controller',
                            headerTitleStyle: { color: 'white' },
                        }}
                    />
                </Stack.Navigator>
            </GestureHandlerRootView>
        </NavigationContainer>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#222',
    },
    button: {
        backgroundColor: '#1E90FF',
        padding: 10,
        marginBottom: 10,
        borderRadius: 5,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    sectionContainer: {
        marginTop: 32,
        paddingHorizontal: 24,
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: '600',
    },
    sectionDescription: {
        marginTop: 8,
        fontSize: 18,
        fontWeight: '400',
    },
    highlight: {
        fontWeight: '700',
    },
});

export default App;
