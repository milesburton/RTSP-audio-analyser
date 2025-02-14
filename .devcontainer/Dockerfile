FROM denoland/deno:latest

USER root

RUN mkdir -p /home/deno && chown deno:deno /home/deno

ENV DENO_DIR=/deno-dir
RUN mkdir -p /deno-dir && chown -R deno:deno /deno-dir && chmod -R 777 /deno-dir

RUN mkdir -p /home/deno/.deno/bin && ln -s "$(which deno)" /home/deno/.deno/bin/deno && chown -R deno:deno /home/deno/.deno

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    unzip \
    fish \
    ffmpeg \
    vim \
    git \
    python3 \
    python3-pip \
    sqlite3 \
    shellcheck \
    ruby \
    && gem install lolcat \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /home/deno/.config/fish && \
    echo 'alias runapp="deno run --allow-env --allow-run --allow-net --allow-read --allow-write /app/src/app.ts"' > /home/deno/.config/fish/config.fish && \
    echo 'set fish_greeting ""' >> /home/deno/.config/fish/config.fish && \
    echo 'echo "Welcome to the Audio Signal Analyser container!" | lolcat' >> /home/deno/.config/fish/config.fish && \
    echo 'echo "To run the application, type: runapp" | lolcat' >> /home/deno/.config/fish/config.fish && \
    chown -R deno:deno /home/deno/.config

WORKDIR /app

COPY . .

USER deno

CMD ["run", "--allow-env", "--allow-run", "--allow-net", "--allow-read", "--allow-write", "src/app.ts"]
