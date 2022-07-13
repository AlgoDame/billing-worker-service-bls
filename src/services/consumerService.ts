import amqp from "amqplib";
import dotenv from "dotenv";
import { Worker } from 'worker_threads';
import path from "path";
dotenv.config();

export class ConsumerService {
    private static pendingTxnQueue: string = process.env.PENDING_TRANSACTION_QUEUE!;
    private static queueUrl: string = process.env.QUEUE_URL!;
    private static completedTxnQueue: string = process.env.COMPLETED_TRANSACTION_QUEUE!;

    public static async receive() {
        try {
            const connection = await amqp.connect(this.queueUrl);
            const channel = await connection.createChannel();
            await channel.assertQueue(this.pendingTxnQueue, { durable: true });

            console.log("Awaiting messages...")

            channel.consume(this.pendingTxnQueue, async (message: any) => {
                const pendingtransactionData = JSON.parse(message.content.toString());
                console.log('Billing worker consumer service receieved::: ', pendingtransactionData);


                const fPath = path.join(__dirname, "../workers/worker.js")
               
                const worker = new Worker(fPath, { workerData: { transaction: pendingtransactionData } });

                worker.on("message", (data) => {
                    console.log('Updated transaction data', data);
                    //send response with data
                    this.send(data);
                }).on('error', (error: any) => {
                    console.error('Error with executing charge:: ', error);
                });

            },
                { noAck: true }
            );



        } catch (error) {
            console.error("Error in billing worker receiver:: ", error);
        }
    }

    private static async send(message: Record<string, any>) {
        const connection = await amqp.connect(this.queueUrl);
        const channel = await connection.createChannel();
        await channel.assertQueue(this.completedTxnQueue, { durable: true });
        channel.sendToQueue(this.completedTxnQueue, Buffer.from(JSON.stringify(message)));
        console.log(`Completed transaction successfully pushed to queue ${this.completedTxnQueue} :: ${JSON.stringify(message)}`);
    }

    

}

