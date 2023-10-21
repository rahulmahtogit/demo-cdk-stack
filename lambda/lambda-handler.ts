export const handler = async (event:any, context:any) => {
    console.log("Consoling event",event);
    console.log("Consoling context",context);
    // if(event && event.body && event.body.enableError){
    //     return {
    //         statusCode: 500,
    //         body: "Error In lambda"
    //     }
    // }
    throw new Error("Error in Lambda");
    
            return {
            statusCode: 500,
            body: "Error In lambda"
        }
    // return {
    //     statusCode: 200,
    //     body: "Hello from lambda"
    // }
}