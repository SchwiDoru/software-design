# Backend Architecture

The backend source code is located in the `src/` directory.

## Folder Structure

- **Controllers/**: Entry points for HTTP requests. Keeps logic minimal by delegating to Services.
- **Services/**: Contains the core business logic and data processing.
- **Models/**: Database entities representing the schema.
- **DTO/**: Data Transfer Objects used to flatten or secure data sent to the client.
- **Data/**: Contains the DbContext and Entity Framework migrations.
- **Program.cs**: Located in `src/`, configures the DI container and middleware.

## Dotnet Commands

Run these commands in the `/backend` folder.

### Package Management

**Add a new library:**
```bash
dotnet add package <PACKAGE_NAME>
```

**Restore packages:**
```bash
dotnet restore
```

### Managing Secrets (Environment Variables)
We use **User Secrets** to keep sensitive data like connection strings out of source control. The Secret ID is already defined in the `backend.csproj`. **Do not run `dotnet user-secrets init` again.** NOTE: secrets are added to your local machine

**Verify user-secrets is setup**

Verify that `backend.csproj` contains a `<UserSecretsId>` tag. If it's there, you are ready to add secrets.

**Add a secret:**
```bash
dotnet user-secrets set "Key" "Value"
```
**View your secrets**
```bash
dotnet user-secrets list"
```
## Docker Workflow

We configured Docker to sync with file changes via Docker Watch.

1. **Sync Source**: Any changes in `src/` trigger an immediate hot reload via `dotnet watch`.
2. **Auto-Rebuild**: Changes to `backend.csproj` trigger a container rebuild to install new NuGet packages automatically.
