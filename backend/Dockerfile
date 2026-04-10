FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /source

# Copy project file and restore
COPY *.csproj ./
RUN dotnet restore

# Copy everything else
COPY . ./

# -------- DEVELOPMENT STAGE --------
FROM build AS dev
ENV ASPNETCORE_URLS=http://0.0.0.0:8080
CMD ["dotnet", "watch", "run", "--no-launch-profile", "--non-interactive"]

# -------- PUBLISH STAGE (PROD BUILD) --------
FROM build AS publish
RUN dotnet publish -c Release -o /app/publish

# -------- PRODUCTION RUNTIME --------
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS prod
WORKDIR /app

# Fix: install missing native lib that Npgsql needs for Kerberos probe on Linux
RUN apt-get update && apt-get install -y libgssapi-krb5-2 && rm -rf /var/lib/apt/lists/*

# Copy published output
COPY --from=publish /app/publish .

EXPOSE 8080

ENV DOTNET_gcServer=0

ENTRYPOINT ["dotnet", "backend.dll"]