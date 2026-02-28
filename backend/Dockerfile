FROM mcr.microsoft.com/dotnet/sdk:10.0-alpine AS base

WORKDIR /source

COPY *.csproj .

RUN dotnet restore

COPY . .

FROM base AS dev

ENV ASPNETCORE_URLS=http://0.0.0.0:8080

CMD ["dotnet", "watch", "run", "--no-launch-profile"]
