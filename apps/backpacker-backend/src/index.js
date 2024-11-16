const { ethers } = require("ethers");

import { Router } from "cartesi-router";
import { Wallet, Notice, Error_out } from "cartesi-wallet";

const { FederatedServer } = require("./federated_model");

const wallet = new Wallet(new Map());

const router = new Router(wallet);

const rollup_server = process.env.ROLLUP_HTTP_SERVER_URL;
console.log("HTTP rollup_server url is " + rollup_server);

const federatedServer = new FederatedServer();
//   let advance_req;
//   const hexResult = viem.stringToHex(result);
//   advance_req = await fetch(rollup_server + "/notice", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({ payload: hexResult }),
//   });
//   const json = await advance_req?.json();
//   console.log(
//     "Received status " +
//     advance_req?.status +
//     " with body " +
//     JSON.stringify(json)
//   );
//   return "accept";
// };

const send_request = async (output) => {
  if (output) {
    let endpoint;
    console.log("type of output", output.type);

    if (output.type == "notice") {
      endpoint = "/notice";
    } else if (output.type == "voucher") {
      endpoint = "/voucher";
    } else {
      endpoint = "/report";
    }

    console.log(`sending request ${typeof output}`);
    const response = await fetch(rollup_server + endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(output),
    });
    console.debug(
      `received ${output.payload} status ${response.status} body ${response.body}`
    );
  } else {
    output.forEach((value) => {
      // send_request(value);
    });
  }
};

async function handle_advance(data) {
  console.log("Received advance request data " + JSON.stringify(data));

  try {
    const payload = data.payload;
    console.log(payload);

    const msg_sender = data.metadata.msg_sender;
    console.log("msg sender is", msg_sender.toLowerCase());

    const payloadStr = hexToString(payload);
    console.log("Payload string", payloadStr);

    if (msg_sender.toLowerCase() === dAppAddressRelayContract.toLowerCase()) {
      rollup_address = payload;
      router.set_rollup_address(rollup_address, "erc20_withdraw");
      console.log("Setting DApp address");
      return new Notice(
        JSON.stringify({
          dappContract: `DApp address set up successfully to ${rollup_address}`,
        })
      );
    }

    const jsonpayload = JSON.parse(payloadStr);
    console.log("Payload string data", jsonpayload);


    if (jsonpayload.method === "submitWeights") {
      try {
        const clientWeights = jsonpayload.data;

        if (!clientWeights || Object.keys(clientWeights).length === 0) {
          return new Error_out("No weights provided");
        }

        federatedServer.clientWeights.push(clientWeights);

        const updated = federatedServer.updateGlobalWeights();

        return new Notice(
          JSON.stringify({
            success: true,
            updated,
            currentVersion: federatedServer.modelVersion,
          })
        );
      }
      catch (e) {
        console.error('Error in submit-weights:', error);
        return new Error_out(`failed to submit weights: ${e}`);
      }
    }

    else if (jsonpayload.method === 'getGlobalWeights') {

      try {
        if (!federatedServer.globalWeights) {
          return new Error_out('No global weights available yet');
        }

        return new Notice(
          JSON.stringify({
            weights: federatedServer.globalWeights,
            version: federatedServer.modelVersion
          })
        );
      }
      catch (e) {
        console.error('Failed to get global weights', error);
        return new Error_out(`failed to get global weights: ${e}`);
      }

    }
    else {
      return router.process(jsonpayload.method, data);
    }
  }
  catch (e) {
    console.error(e);
    return new Error_out(`failed to process advance_request ${e}`);
  }
}

async function handle_inspect(data) {
  console.log("Received inspect request data " + JSON.stringify(data));
  const url = hexToString(data.payload).split("/");
  console.log(url);
  return router.process(url[0], url[1]);
}

var handlers = {
  advance_state: handle_advance,
  inspect_state: handle_inspect,
};

var finish = { status: "accept" };

(async () => {
  while (true) {
    const finish_req = await fetch(rollup_server + "/finish", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "accept" }),
    });

    console.log("Received finish status " + finish_req.status);

    if (finish_req.status == 202) {
      console.log("No pending rollup request, trying again");
    } else {
      const rollup_req = await finish_req.json();

      var typeq = rollup_req.request_type;
      console.log(typeq);
      var handler;
      if (typeq === "inspect_state") {
        handler = handlers.inspect_state;
      } else {
        handler = handlers.advance_state;
      }
      var output = await handler(rollup_req.data);
      finish.status = "accept";
      if (output instanceof Error_out) {
        finish.status = "reject";
      }
      // send the request
      await send_request(output);
    }
  }
})();
