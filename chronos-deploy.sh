#!/usr/bin/env bash

declare -a countries=(
"XX" "YY" "ZZ"
)

for country in "${countries[@]}"
do
    export DEPLOY_APP_COUNTRY=${country}
    envsubst < chronos.json > chronos-env.json
    JSON_HASH=$(/bin/cat chronos-env.json)

    echo ${JSON_HASH}
    curl -vvv -L -H 'Content-Type: application/json' -X POST -d@chronos-env.json http://${CHRONOS_HOST}:4400/scheduler/iso8601 
done
