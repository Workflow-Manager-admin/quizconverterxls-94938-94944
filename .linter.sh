#!/bin/bash
cd /home/kavia/workspace/code-generation/quizconverterxls-94938-94944/main_container_for_quizconverterxls
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

