# speech-synthesizer

NodeJS library providing local TTS synthesis leveraging VITS (Conditional Variational Autoencoder with Adversarial Learning for End-to-End Text-to-Speech) by using ONNX.

## Introduction

This library is based on the work from the folks over at [Coqui.ai](https://coqui.ai/), specifically the code in this repository is based on their [TTS](https://github.com/coqui-ai/TTS) work. This library provides a completly local TTS pipeline that can run in both the browser and server side in NodeJS environments.

## Install

```bash
npm install --save "speech-synthesizer
```

## Usage

```ts
import { SpeechSynthesizer } from "speech-synthesizer";

const speechSynthesizer = await SpeechSynthesizer.create();

// This outputs a Float32Array of single channel 22050hz audio data
const audio = await speechSynthesizer.process("Hello world");
```
