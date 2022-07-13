import { ConsumerService } from "./services/consumerService";

console.log("Waiting for rabbitmq blws")
setTimeout(() => {
    ConsumerService.receive();

}, 40 * 1000)