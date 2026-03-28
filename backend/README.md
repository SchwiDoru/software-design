# Backend Architecture

The backend source code is located in the `src/` directory.

## Folder Structure

- **Controllers/**: Entry points for HTTP requests. Keeps logic minimal by delegating to Services.
- **Services/**: Contains the core business logic and data processing.
- **Models/**: Database entities representing the schema.
- **DTO/**: Data Transfer Objects used to flatten or secure data sent to the client.
- **Data/**: Contains the DbContext and Entity Framework migrations.
- **Program.cs**: Located in `src/`, configures the DI container and middleware.

## Installing .NET 10

### macOS

```bash
# Using Homebrew
brew install --cask dotnet-sdk

# Or download directly from Microsoft
# https://dotnet.microsoft.com/en-us/download/dotnet/10.0
```

### Windows

```powershell
# Using winget
winget install Microsoft.DotNet.SDK.10

# Or download the installer from:
# https://dotnet.microsoft.com/en-us/download/dotnet/10.0
```

### Linux (Ubuntu/Debian)

```bash
# Add the Microsoft package repository
wget https://packages.microsoft.com/config/ubuntu/$(lsb_release -rs)/packages-microsoft-prod.deb -O packages-microsoft-prod.deb
sudo dpkg -i packages-microsoft-prod.deb
rm packages-microsoft-prod.deb

# Install the SDK
sudo apt-get update && sudo apt-get install -y dotnet-sdk-10.0
```

### Verify Installation

```bash
dotnet --version
# Expected output: 10.x.x
```

## Running the Project

Run these commands in the `/backend` folder.

### Local Development (without Docker)

```bash
# Restore packages
dotnet restore

# Run the project with hot reload
dotnet watch run
```
