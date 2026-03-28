FROM mcr.microsoft.com/dotnet/sdk:10.0-alpine AS build
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
FROM mcr.microsoft.com/dotnet/aspnet:10.0-alpine AS prod
WORKDIR /app

# Copy published output
COPY --from=publish /app/publish .

# Expose the default .NET container port
EXPOSE 8080

# 🔴 Replace with your actual DLL name
ENTRYPOINT ["dotnet", "backend.dll"]
