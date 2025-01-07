import React, { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import * as EXIF from 'exifreader';
import imageCompression from 'browser-image-compression';
import { Link, useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fhcsffagxchzpxouuiuq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoY3NmZmFneGNoenB4b3V1aXVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYyMTQzMzAsImV4cCI6MjA1MTc5MDMzMH0.1DMl870gjGRq5LRlQMES9WpYWehiKiPIea2Yj1q4Pz8';
const supabase = createClient(supabaseUrl, supabaseKey);

function Tracker({ loggedInUser, onLogout }) {
  // ... (rest of the component remains the same)

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!mainPhoto) {
      setErrorMessage('请先拍摄或上传照片');
      return;
    }

    if (loading) {
      console.log('User data is still loading, please wait.');
      return;
    }

    const newLog = {
      id: uuidv4(),
      user_id: loggedInUser.id,
      input_amount: parseFloat(inputAmount), // Corrected data type
      cash_out_amount: parseFloat(cashOutAmount), // Corrected data type
      main_photo: mainPhoto,
      winning_photos: winningPhotos, // Now correctly handles array
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from('tiger_game_logs')
        .insert([newLog]);

      if (error) {
        console.error('添加打老虎记录时发生错误:', error);
        setErrorMessage('添加打老虎记录失败，请重试: ' + error.message); // More informative error message
      } else {
        console.log('打老虎记录添加成功:', data);
        setLogs((prevLogs) => [...prevLogs, { ...newLog, id: data[0].id }]);
        // ... (rest of the success handling remains the same)
      }
    } catch (error) {
      console.error('发生意外错误:', error);
      setErrorMessage('发生意外错误，请重试: ' + error.message); // More informative error message
    }
  };

  // ... (rest of the component remains the same)
}

export default Tracker;
