import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { GeminiService } from "./gemini.service";
import { NlApiService } from "./nl-api.service";
import { AgentService } from "./agent.service";

@Module({
  imports: [ConfigModule],
  providers: [GeminiService, NlApiService, AgentService],
  exports: [GeminiService, NlApiService, AgentService],
})
export class GoogleAiModule {}
