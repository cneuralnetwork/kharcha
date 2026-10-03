import assert from 'node:assert/strict';
import test from 'node:test';
import { parseBankSms } from '../src/lib/parser.ts';

test('parses a debit while keeping source fields for review', () => {
  assert.deepEqual(parseBankSms('A/C X3381 debited by INR 2,480.00 to VPA zomato@pay Ref 123456789012 on 04-10-2026'), {
    merchant: 'Zomato@Pay', amountPaise: 248000, direction: 'debit', category: 'Food & dining',
    accountLast4: '3381', reference: '123456789012', confidence: 0.95,
  });
});

test('leaves uncertain transaction for review', () => {
  const result = parseBankSms('Rs. 92.50 was spent on your card');
  assert.equal(result?.direction, 'debit');
  assert.equal(result?.amountPaise, 9250);
  assert.equal(result?.confidence, 0.45);
});

test('rejects OTP, marketing, and ambiguous movement', () => {
  assert.equal(parseBankSms('Your OTP is 482991 for a Rs 900 transaction. Do not share.'), null);
  assert.equal(parseBankSms('Rs 500 cashback offer. Shop now and save.'), null);
  assert.equal(parseBankSms('Rs 500 debited and then credited to your account.'), null);
});

test('rejects invalid and oversized amounts', () => {
  assert.equal(parseBankSms('INR 0 debited from your account.'), null);
  assert.equal(parseBankSms('INR 999999999 debited from your account.'), null);
});

test('uses the transaction amount instead of the available balance', () => {
  const result = parseBankSms('Avl bal INR 8,000. A/C X3381 debited by INR 200.00 to VPA cafe@upi Ref 123456789012');
  assert.equal(result?.amountPaise, 20000);
  assert.equal(result?.confidence, 0.95);
});

test('stops the merchant before payment rail wording', () => {
  const result = parseBankSms('Rs. 499.00 debited from A/c XX1234 at Book Mart via UPI. Ref 9876543210. Avl bal Rs. 12000.');
  assert.equal(result?.merchant, 'Book Mart');
  assert.equal(result?.category, 'Shopping');
  assert.equal(result?.amountPaise, 49900);
});
