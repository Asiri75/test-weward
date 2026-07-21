import './src/polyfills'; // must run before any h3-js import (TextDecoder utf-16le)
import { registerRootComponent } from 'expo';

import App from './App';

registerRootComponent(App);
