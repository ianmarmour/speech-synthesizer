# speech-synthesizer

NodeJS library providing local TTS synthesis leveraging VITS (Conditional Variational Autoencoder with Adversarial Learning for End-to-End Text-to-Speech) by using ONNX.

## Introduction

This library provides a completly local TTS pipeline that can run in both the browser and in server side NodeJS environments. As far as I'm aware of this library is one of the first of it's kind as previous TTS's libraries have either called 3rd party APIs or relied on older TTS methods such as E-Speak. This library is based on the work from the folks over at [Coqui.ai](https://coqui.ai/), specifically their [TTS](https://github.com/coqui-ai/TTS) work.

## Install

```bash
npm install --save "speech-synthesizer
```

## Usage

```ts
import { SpeechSynthesizer } from "speech-synthesizer";

const speechSynthesizer = await SpeechSynthesizer.create();

// This outputs a Float32Array of single channel 22050hz audio data
const audio = await speechSynthesizer.synthesize("Hello world");
```

## Additional Information

This library is still in it's early stages and some of the code needs to be refactored and improved. The external interface at this point should be stable though and ready for consumption. There needs to be improvements made to the cross platform support and optimizations to speed still however this project is perfectly usable as is and should be sufficient for most use cases.
