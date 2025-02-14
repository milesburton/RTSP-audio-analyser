# Use the Debian-based Deno image
FROM denoland/deno:latest

# Switch to root to install packages and make system changes
USER root

# Ensure the home directory exists for the deno user
RUN mkdir -p /home/deno && chown deno:deno /home/deno

# Create and configure the DENO_DIR for caching
ENV DENO_DIR=/deno-dir
RUN mkdir -p /deno-dir && chown -R deno:deno /deno-dir && chmod -R 777 /deno-dir

# Create a symlink for the Deno binary in the expected location for the language server
RUN mkdir -p /home/deno/.deno/bin && ln -s "$(which deno)" /home/deno/.deno/bin/deno && chown -R deno:deno /home/deno/.deno

# Install FFmpeg and additional utilities (using --no-install-recommends to keep the image slim)
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

# Configure Fish shell: create a config file with a 'runapp' alias and welcome message
RUN mkdir -p /home/deno/.config/fish && \
    echo 'alias runapp="deno run --allow-env --allow-run --allow-net --allow-read --allow-write /app/src/app.ts"' >> /home/deno/.config/fish/config.fish && \
    echo 'echo "Welcome to the Audio Signal Analyser container!"' >> /home/deno/.config/fish/config.fish && \
    echo 'echo "To run the application, type: runapp"' >> /home/deno/.config/fish/config.fish && \
    chown -R deno:deno /home/deno/.config

# Set the working directory inside the container
WORKDIR /app

# Copy all project files into the container (build context is the project root)
COPY . .

# Switch back to the deno user
USER deno

# Default command to run the application
CMD ["run", "--allow-env", "--allow-run", "--allow-net", "--allow-read", "--allow-write", "src/app.ts"]
