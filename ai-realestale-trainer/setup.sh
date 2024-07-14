#!/bin/bash

# Create lib file
mkdir -p dependencies

# Define the packages to download
packages=(
	libnss3
    libnss3-dev
    libnspr4
    libgbm1
    libwayland-server0
)

# Loop through each package, download it
for pkg in "${packages[@]}"; do
    echo "Downloading and extracting $pkg..."
    apt-get download "$pkg"
done

# Extract libs
for deb_file in *.deb; do
    echo "Extracting $deb_file..."
    dpkg-deb -x "$deb_file" ./dependencies
    rm $deb_file
done

# Links libs
mkdir $HOME/dependencies
cp -r ./dependencies/* $HOME/dependencies
export LD_LIBRARY_PATH=$HOME/dependencies/lib/x86_64-linux-gnu:$HOME/dependencies/usr/lib/x86_64-linux-gnu:$LD_LIBRARY_PATH
export PATH=$HOME/dependencies/usr/bin:$PATH

echo "All packages downloaded"