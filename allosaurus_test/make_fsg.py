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
import unicodedata
from text_unidecode import unidecode 

try:
    unicode()
except:
    unicode = str

def segment_string(s):
    results = []
    padded_s = " "+s   # add a placeholder as the first character
    padded_s = unicodedata.normalize('NFD', padded_s)
    classes = [unicodedata.category(c)[0] for c in padded_s]
    for c, c_class in zip(padded_s, classes):
        if c_class in ['Z', 'L', 'N']:                             # separator or letter or number?
            results.append((c.lower(), c_class))                   # treat it as itself
        elif c_class in ['M','P'] and results[-1][1] in ['L','S']: # diacritic or punctuation after letter?
            results[-1] = (results[-1][0] + c, 'S')                # treat it as a special letter
        elif c_class in ['C','S']:                                 # other or symbol?
            results.append((c.lower(), 'S'))                       # treat it as a special letter
        # otherwise, we don't consider it for pronunciation purposes

    results = [ r for r in results if r[1] in ['L','S']]  # removes placeholder, other separators, numbers

    a = [ decode(c, c_class) for c, c_class in results]
    print([c[0] for c in a])
    print([c[1] for c in a])

def decode(c, c_class):
    result = unidecode(c)
    if result == c: 
        return (result.lower(), c_class)
    else:
        return (result.lower(), 'S')

segment_string("François, Deux-Sèvresŋɳɫʎ")

