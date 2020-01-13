#!/usr/bin/env python3
# -*- coding: utf-8 -*-

#####################################################
#
# curl_test
#
# testing the CURL interface to Xinjian's recognizer
#
#####################################################


from __future__ import print_function, unicode_literals
from __future__ import division, absolute_import
import argparse
import os
import requests
import logging
import unicodedata 
import numpy as np
from bidict import bidict

import panphon.distance
dst = panphon.distance.Distance()

try:
    unicode()
except:
    unicode = str

ALLOSAURUS_URL = "https://www.dictate.app/phone/"
INVENTORY_FILENAME = 'phone_inventory.txt'
VOCAB = bidict()

def query_allosaurus(audio_path, lang="ipa", url=ALLOSAURUS_URL):
    logging.info("Sending audio to Allosaurus")
    url += lang.lower()
    with open(audio_path, "rb") as fin:
        audio_filename = os.path.basename(audio_path)
        files = { 'file': (audio_filename, fin) }
        response = requests.post(url, files=files)

    logging.info("Response received, status %s", response.status_code)
    response.raise_for_status()
    return response.text


def get_phone_vocab(filename=INVENTORY_FILENAME):
    global VOCAB
    if len(VOCAB) == 0:
        VOCAB["<s>"] = 0
        with open(filename, 'r', encoding="utf-8") as fin:
            for line in fin.readlines():
                if not line.strip():
                    continue
                parts = line.strip().split(" ")
                if len(parts) < 2:
                    continue
                char = unicodedata.normalize("NFD", parts[0])
                index = int(parts[1])
                VOCAB[char] = index
    return VOCAB



from string import ascii_lowercase

ASCII_EXCEPTIONS = {
    "c": ["tʃ", "k", "s"],
    "y": ["j", "y"],
    "x": ["x", "ks"],
    "j": ["j", "x", "ʒ", "dʒ"],
    "g": ["ɡ"],
}

IPA = "ʈɖɟɡɢʔɱɳɲŋɴʙⱱɾɽʀɸβθðʃʒʂʐçʝɣχʁħʕhɦʋɹɻɰɬɮɭʎʟɫƥɓƭɗƈʄƙɠʠʛʘǀǁǃǂʍwɥʜʢʡɕʑɧɺʦʣʧʤʨʥɚɝɨʉɯɪʏʊøɘɵɤəɛœɜɞʌɔæɐɶɑɒ"

IPA_EXCEPTIONS = {  # things that aren't in panphon, etc.
    "ʧ": ["tʃ"],
    "ʤ": ["dʒ"],
    "ʨ": ["tɕ"],
    "ʥ": ["dʑ"],
    "ʦ": ["ts"],
    "ʣ": ["dz"],
    "ƭ": ["ɗ"],
    "ɚ": ["ɹ"],
    "ʜ": ["h"],
    "ƈ": ["ʄ"],
    "ʢ": ["ɦ"],
    "ƥ": ["ɓ"],
    "ƙ": ["ɠ"],
    "ʠ": ["ʛ"],
    "ⱱ": ["v"]
}


def make_orth_mapping():
    result = { "<s>": ["<s>"] }
    for c in ascii_lowercase:
        result[c] = [c]
    for c, l in ASCII_EXCEPTIONS.items():
        result[c] = l
    for c in IPA:
        result[c] = [c]
    for c, l in IPA_EXCEPTIONS.items():
        result[c] = l
    return result

MAX_DISTANCE = 10.0

def make_mapping_between_vocabs(vocab1, vocab2, k=1., norm_axis=0):
    dst = panphon.distance.Distance()
    mapping = np.ndarray((len(vocab1), len(vocab2)))
    max_distance = -1
    for c1, i1 in vocab1.items():
        for c2, i2 in vocab2.items():
            if "<s>" in [c1, c2]:
                dist = 0. if c1 == c2 else np.nan
            else: 
                try:
                    dist = dst.weighted_feature_edit_distance(c1, c2)
                except AttributeError:
                    logging.warning("cannot process %s,%s" % (c1, c2))
                    dist = np.nan
            mapping[i1,i2] = dist
            if dist > max_distance:
                max_distance = dist
    
    mapping = mapping.nan_to_num(mapping, copy=True, nan=max_distance)

    # invert the distances to treat as a factor
    # normalize to pseudo-probs
    mapping = 1/(mapping+k)    
    mapping = mapping / np.sum(mapping, axis=norm_axis, keepdims=True) 
    return mapping

from itertools import chain

def make_g2p_vocab():
    ORTH_MAPPING = make_orth_mapping()
    OUTPUT_VOCAB_KEYS = list(set(chain(*ORTH_MAPPING.values())))
    g2p_vocab = bidict({c:i for i,c in enumerate(OUTPUT_VOCAB_KEYS)})
    return g2p_vocab


allosaurus_vocab = get_phone_vocab()
g2p_vocab = make_g2p_vocab()
phon_mapping = make_mapping_between_vocabs(allosaurus_vocab, g2p_vocab, norm_axis=1)

def test_mapping(c):
    k_mapping = phon_mapping[allosaurus_vocab[c]]
    indices = np.argsort(-k_mapping)[:30]
    cs = [(g2p_vocab.inverse[i], k_mapping[i]) for i in indices]
    logging.info(cs)

    indices = np.argsort(k_mapping)[:30]
    cs = [(g2p_vocab.inverse[i], k_mapping[i]) for i in indices]
    logging.info(cs)


# PLAN
# start with a trivial WFSA where each node is a phone and
# can only lead to itself or the next.


def pad_with_boundaries(s):
    return s

def make_trivial_wfsa(s, g2p_vocab, phon_mapping):
    padded_string = pad_with_boundaries(s)

    len_s = len(padded_string)
    num_phones = phon_mapping.shape[0]
    # the following is a little weird looking, the first part just
    # makes identity transitions back to the current state, the second
    # part makes a transition to the next state
    result = np.diag([0.1] * len_s) + np.diag([0.9] * (len_s-1), 1)

    result = result / np.sum(result, axis=1, keepdims=True)
    result = np.expand_dims(result, axis=2)
    transitions = np.ones((1,1,num_phones))
    result = result * transitions

    # for this simple one, there'd be a faster way to do this because
    # every edge out of a node is the same here, but this won't necessarily
    # be the case in the future

    for i, c in enumerate(padded_string):
        phone_index = g2p_vocab[c]
        transition_probs = phon_mapping[:,phone_index]
        result[i,i,:] *= transition_probs

    for i, c in enumerate(padded_string[:-1]):
        phone_index = g2p_vocab[c]
        transition_probs = phon_mapping[:,phone_index]
        result[i,i+1,:] *= transition_probs

    return result




def string_to_one_hot(s, vocab):
    indices = [vocab[c] for c in s]
    return np.identity(len(vocab))[indices]


# If you imagine the WFSA for a particular recognizer as being something like this:
#
# .5 .5 .0 .0 .0
# .0 .5 .5 .0 .0
# .0 .0 .5 .5 .0
# .0 .0 .0 .5 .5
# .0 .0 .0 .0 1.
#
# you'll notice that each kind of edge (an edge to the same node, or an edge to the next node)
# is a diagonal.  Because we know all the other diagonals are zero, we don't bother constructing
# or working with them, we only construct the diagonals.  Doing sums (or other operations) on 
# either rows or columns is accomplished by shifting the shorter diagonals as appropriate.
#
# For convenient shifting, we pad the diagonals with zeros and then slice as appropriate, rather than
# pad with zeros each time we want to shift.  So when you want to use the "next" edges for a horizontal
# computation, it's next_edges[1:], and for a vertical computation, it's next_edges[:-1].

def make_edges(padded_string, vocab, phon_mapping, self_weight=0.005, next_weight=0.7, eps_next_weight=0.005):

    d_str = len(padded_string)  # dimension along the character axis
    d_phon = phon_mapping.shape[1] # dimension along the phone probabilities

    self_edges = np.tile(self_weight, (d_str, 1))
    next_edges = np.tile(next_weight, (d_str + 1, d_phon))
    eps_next_edges = np.tile(eps_next_weight, (d_str + 1, 1))
    next_edges[0,:] = 0.
    next_edges[-1,:] = 0.
    eps_next_edges[0,:] = 0.
    eps_next_edges[-1,:] = 0.
    horizontal_sum = self_edges[:,0] + next_edges[1:,0] + eps_next_edges[1:,0] 
    horizontal_sum = np.expand_dims(horizontal_sum, axis=1)
    self_edges = self_edges / horizontal_sum
    next_edges[1:,:] = next_edges[1:,:] / horizontal_sum
    eps_next_edges[1:,:] = eps_next_edges[1:,:] / horizontal_sum
    
    transition_probs = np.array([phon_mapping[vocab[c],:] for c in padded_string])
    #self_edges = self_edges * transition_probs
    next_edges[1:-1] *= next_edges[1:-1] * transition_probs[:-1]

    return self_edges, next_edges, eps_next_edges

def shift_search(query, corpus, acoustic_vocab, g2p_vocab, phon_mapping):
    padded_query = pad_with_boundaries(query)
    padded_corpus = pad_with_boundaries(corpus)
    self_edges, next_edges, eps_next_edges = make_edges(padded_corpus, acoustic_vocab, phon_mapping)
    input_probs = string_to_one_hot(padded_query, g2p_vocab)
    
    initial_prob = 1. / len(padded_corpus)
    position_probs = np.repeat(initial_prob, len(padded_corpus))
    self_probs = np.zeros((self_edges.shape[0]))
    next_probs = np.zeros((next_edges.shape[0]))
    eps_next_probs = np.zeros((eps_next_edges.shape[0]))

    for i in range(input_probs.shape[0]):
        position_probs = np.expand_dims(position_probs, axis=1)
        current_input = input_probs[i,:]
        
        self_probs = np.sum(self_edges * position_probs, axis=1)
        print("self_probs = ", self_probs)
        next_probs[1:] = np.sum(next_edges[1:,:] * position_probs * current_input, axis=1)
        print("next_probs = ", next_probs)
        eps_next_probs[1:] = np.sum(eps_next_edges[1:,:] * position_probs, axis=1)
        print("eps_probs = ", eps_next_probs)
        position_probs = self_probs + next_probs[:-1] + eps_next_probs[:-1]

        position_probs[-1] = 0.  # otherwise, the last position just accummulates probability
                                 # because there's only one edge out, messing up normalization
        position_probs /= np.sum(position_probs)

        print(i, position_probs)

    return position_probs

import time
import sparse

def dense_search(query, corpus):
    padded_corpus = pad_with_boundaries(corpus)
    input_probs = acoustic_output_to_one_hot(padded_corpus, allosaurus_vocab)
    wfsa = make_trivial_wfsa(query, g2p_vocab, phon_mapping)
    current_position_probs = np.zeros((len(query) + 2))
    current_position_probs[0] = 1.
    for i in range(input_probs.shape[0]):
        current_position_probs = np.reshape(current_position_probs, (-1,1,1))
        current_input = input_probs[i,:]
        current_position_probs = wfsa * current_position_probs
        current_position_probs = np.einsum("ijk,k->j", current_position_probs, current_input)
        current_position_probs = current_position_probs / np.sum(current_position_probs)
        current_position_probs = current_position_probs * (current_position_probs > 0.000001)
    return current_position_probs


def sparse_search(query, corpus):
    padded_corpus = pad_with_boundaries(corpus)
    input_probs = acoustic_output_to_one_hot(padded_corpus, allosaurus_vocab)
    wfsa = make_trivial_wfsa(query, g2p_vocab, phon_mapping)
    current_position_probs = np.zeros((len(query) + 2))
    current_position_probs[0] = 1.
    wfsa = sparse.COO(wfsa)
    current_position_probs = sparse.COO(current_position_probs)
    for i in range(input_probs.shape[0]):
        current_position_probs = np.reshape(current_position_probs, (-1,1,1))
        current_input = input_probs[i,:]
        current_position_probs = wfsa * current_position_probs
        current_position_probs = current_position_probs * current_input 
        current_position_probs = np.sum(current_position_probs, axis=2)
        current_position_probs = np.sum(current_position_probs, axis=0)
        current_position_probs = current_position_probs / np.sum(current_position_probs)
        current_position_probs = current_position_probs * (current_position_probs > 0.000001)
    return current_position_probs

#start_time = time.time()
#current_position_probs = dense_search(test_query, test_corpus)
#print("Current position = ", list(current_position_probs))
#print("Elapsed time = ", time.time() - start_time)

np.set_printoptions(suppress=True)

test_query = ["k", "i", "b", "a", "n"] 
test_corpus = ["m", "u", "n", "k", "e", "b", "o", "n", "j", "o", "x", "u", "n", "m","u","m","f","l","o",
         "k", "i", "p", "a", "n", "w", "o" ] * 2500

test_corpus += ["<s>","<s>","<s>","<s>","<s>"] 

start_time = time.time()
position_probs = shift_search(test_query, test_corpus, allosaurus_vocab, g2p_vocab, phon_mapping)
print(position_probs)
print("Elapsed time = ", time.time() - start_time)