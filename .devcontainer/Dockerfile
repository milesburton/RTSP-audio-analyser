FROM denoland/deno:latest

USER root

# Create directories and set permissions
RUN mkdir -p /home/deno && chown deno:deno /home/deno
ENV DENO_DIR=/deno-dir
RUN mkdir -p /deno-dir && chown -R deno:deno /deno-dir && chmod -R 777 /deno-dir
RUN mkdir -p /home/deno/.deno/bin && ln -s "$(which deno)" /home/deno/.deno/bin/deno && chown -R deno:deno /home/deno/.deno

# Install system packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    unzip \
    fish \
    ffmpeg \
    vim \
    git \
    python3 \
    python3-pip \
    python3-venv \
    python3-dev \
    sqlite3 \
    shellcheck \
    tree \
    ruby \
    ssh \
    build-essential \
    libssl-dev \
    && gem install lolcat \
    && rm -rf /var/lib/apt/lists/*

# Set up Python virtual environment
ENV VIRTUAL_ENV=/opt/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Install Python dependencies in virtual environment
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir \
    numpy \
    tensorflow \
    tensorflow-hub \
    tensorflowjs

# Create directory for YAMNet conversion
RUN mkdir -p /workspaces/audio-signal-analyser/yamnet_conversion && \
    chown deno:deno /workspaces/audio-signal-analyser/yamnet_conversion

# Set up fish configuration
RUN mkdir -p /home/deno/.config/fish && \
    echo 'alias runapp="deno run --allow-env --allow-run --allow-net --allow-read --allow-sys --allow-write src/app.ts"' > /home/deno/.config/fish/config.fish && \
    echo 'set fish_greeting ""' >> /home/deno/.config/fish/config.fish && \
    echo 'echo "Welcome to the Audio Signal Analyser container!" | lolcat' >> /home/deno/.config/fish/config.fish && \
    echo 'echo "To run the application, type: runapp" | lolcat' >> /home/deno/.config/fish/config.fish && \
    # Add virtual environment activation to fish config
    echo 'source /opt/venv/bin/activate.fish' >> /home/deno/.config/fish/config.fish && \
    chown -R deno:deno /home/deno/.config

# Copy the conversion script
COPY convert_yamnet.py /workspaces/audio-signal-analyser/yamnet_conversion/
RUN chown deno:deno /workspaces/audio-signal-analyser/yamnet_conversion/convert_yamnet.py

USER deno