// import { Stack, StackProps } from 'aws-cdk-lib';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as path from "path";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { ComparisonOperator } from 'aws-cdk-lib/aws-cloudwatch';
import { SnsAction } from 'aws-cdk-lib/aws-cloudwatch-actions';


export class CdkDemoStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const snsTopic = new sns.Topic(this, 'lambdaDLQTopic',{
      displayName: 'testTopic',
      topicName: 'alertTopic'
    });

    const testQueue = new sqs.Queue(this, 'Queue', {
      visibilityTimeout: cdk.Duration.seconds(300)
    });
    const lambdaFunction = new NodejsFunction(this, 'MyLambda', {
      functionName: 'lambdaDLQTest',
        entry: path.join(__dirname, '../lambda/lambda-handler.ts'),
        handler: 'handler', 
        runtime: lambda.Runtime.NODEJS_16_X, 
        memorySize: 128, 
        timeout: cdk.Duration.seconds(10), 
        // deadLetterQueueEnabled: true,
        // deadLetterTopic:snsTopic
        // onFailure: 
        
        // deadLetterQueue: CdkDemoStack.createDeadLetterQueue(this, `Test-${id}`,{
        //   alarmTopic:snsTopic
        // })
      });

      new cdk.aws_lambda.CfnEventSourceMapping(this, `test-event-source-mapping`,{
        functionName: lambdaFunction.functionArn,
        enabled: true,
        maximumRetryAttempts: 3,
        startingPosition: 'LATEST',
        destinationConfig:{
          onFailure:{
            destination: CdkDemoStack.createDeadLetterQueue(this, `Test-${id}`,{
          alarmTopic:snsTopic
        })
          }
        }
      })
      


  }
  /**
   * createDeadLetterQueue
   */
  public static createDeadLetterQueue(
    scope: Construct,
    id: string,
    props:{
      alarmTopic: sns.ITopic
    }
  ) {
    const deadLetterQueue = new sqs.Queue(scope, `${id}`,{
      queueName: `${id}deadLetterQueue`
    })

    const alarm = deadLetterQueue.metric('ApproximateNumberOfMessagesVisible',{
      period: cdk.Duration.minutes(5),
      statistic: 'sum'
    }).createAlarm(scope,`${id}DLQAlarm`,{
      alarmDescription: "Alarm is working",
      threshold: 0,
      comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
      evaluationPeriods: 1
    })

    alarm.addAlarmAction(new SnsAction(props.alarmTopic))

    return deadLetterQueue.queueArn;


    
  }
}
