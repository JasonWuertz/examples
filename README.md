# Automating inventory management using the Convictional API
### Part 1 - Getting and monitoring product inventory
The Convictional REST API allows developers to create custom integrations and add custom features. It's constantly expanding to expose more data and tools to third party developers. 
This tutorial series will walk through interacting with various pieces of data in Convictional, how the data models work and how to best access them. Convictional currently has two personas (i.e., two types of accounts): Buyers and Sellers. Sellers are the vendors in this case with specific products that they want to offer to other companies for B2C distribution. Buyers on the other hands are those companies looking for additional products to offer on their marketplace for consumers. Convicitonal connects these two types of accounts together by allowing sellers to add and price products onto their platform and then providing a consistent, simple format for buyers to access these products. The difference between these account types is most obvious when looking at orders. Buyers are the only type of accounts able to 'create' orders. These orders are usually on behalf of consumers, Convictional takes these orders and routes them to the appropriate seller so that they can ship the right product to the right customer. 
For the purpose of simplicity we'll be interacting as a seller. The principles and techniques outlined in this series will stiil appy to the buyer API as well though. 

Process diagram:
https://lucid.app/publicSegments/view/8ae422f9-bb27-4ab3-a5a5-1dc8cb05d2d6/image.png 
 ** Replace spanner in that with firestore **

### Setting up your cloud environment
* Services required:
	* Spanner
		* You need an instance, database and table
	* Secret Manager
		* I'm also using Doppler but that's completely optional
- [ ] Cloud Functions
### Setting up your Convictional Account
if you don't already have an account that you want to work with please follow this article on how to create a test seller account. You will need this account in order to get an API key that we'll use to test our app. Since this part of the tutorial is based on products and their inventory you'll also need to create at least 1 product in your test account. 
### Set up your development environment
Before we get our hands dirty coding I'll outline what environment I'm using in case you're looking to follow along.
I'll be building my monitoring system using Node.js Nightly via TypeScript 3+ hosted as a GCP cloud function. To develop and test the function I'll be making use of the function test framework link links 
We'll need a spot to store a bit of state, mainly a product ID, it's current inventory and when we retrieved that piece of data. Any databases of choice will do. Keeping with my theme of GCP I'll be using Spanner to store that. Since I don't want to deploy evertime just to see if anything works I'll also be installing the gcloud command line tool and setting up a local Spanner emulator LINK. 
### Getting all products
put code sample here or link to stuff in readme.io ?